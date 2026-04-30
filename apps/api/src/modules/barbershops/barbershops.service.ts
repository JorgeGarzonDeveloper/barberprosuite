import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { GeoService } from "../geo/geo.service";
import { CreateBarbershopDto } from "./dto/create-barbershop.dto";
import { UpdateBarbershopDto } from "./dto/update-barbershop.dto";
import * as QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import * as sharp from "sharp";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

@Injectable()
export class BarbershopsService {
  private s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
  private s3Bucket = process.env.AWS_S3_BUCKET || "barberprosuite-media";

  constructor(
    private prisma: PrismaService,
    private geo: GeoService
  ) {}

  async findNearby(latitude: number, longitude: number, radiusKm = 10, limit = 20) {
    const bbox = this.geo.getBoundingBox({ lat: latitude, lng: longitude }, radiusKm);

    const shops = await this.prisma.barbershop.findMany({
      where: {
        isActive: true,
        latitude: { gte: bbox.minLat, lte: bbox.maxLat },
        longitude: { gte: bbox.minLng, lte: bbox.maxLng },
      },
      include: {
        services: { where: { isActive: true } },
        _count: { select: { queueEntries: true, appointments: true } },
      },
    });

    // Calcular distancias reales y ordenar
    const shopsWithDistance = shops
      .map((shop) => ({
        ...shop,
        distanceMeters: this.geo.calculateDistance(
          { lat: latitude, lng: longitude },
          { lat: shop.latitude, lng: shop.longitude }
        ),
      }))
      .filter((s) => s.distanceMeters <= radiusKm * 1000)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, limit);

    return shopsWithDistance;
  }

  async findAll(page = 1, limit = 20, search?: string, includeInactive = false) {
    const activeFilter = includeInactive ? {} : { isActive: true };
    const where = search
      ? {
          ...activeFilter,
          OR: [
            { name: { contains: search, mode: "insensitive" as any } },
            { city: { contains: search, mode: "insensitive" as any } },
            { address: { contains: search, mode: "insensitive" as any } },
          ],
        }
      : activeFilter;

    const [shops, total] = await Promise.all([
      this.prisma.barbershop.findMany({
        where,
        include: {
          services: { where: { isActive: true } },
          owner: { select: { firstName: true, lastName: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { rating: "desc" },
      }),
      this.prisma.barbershop.count({ where }),
    ]);

    return {
      data: shops,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const shop = await this.prisma.barbershop.findUnique({
      where: { id },
      include: {
        services: { where: { isActive: true } },
        barbers: {
          where: { isAvailable: true },
          include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            client: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
            barber: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    });

    if (!shop) throw new NotFoundException("Barbería no encontrada");
    return shop;
  }

  async canClientReview(barbershopId: string, clientId: string): Promise<{ canReview: boolean; appointmentId?: string }> {
    // Buscar cita COMPLETADA del cliente en esta barbería sin reseña
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        barbershopId,
        client: { userId: clientId },
        status: "COMPLETED",
        // No debe existir reseña para esta cita
        id: {
          notIn: (
            await this.prisma.review.findMany({
              where: { barbershopId, appointmentId: { not: null } },
              select: { appointmentId: true },
            })
          )
            .map((r) => r.appointmentId)
            .filter((id): id is string => id !== null),
        },
      },
      orderBy: { completedAt: "desc" },
      include: { barber: true },
    });

    if (!appointment) return { canReview: false };
    return { canReview: true, appointmentId: appointment.id, barberId: appointment.barberId } as any;
  }

  async create(ownerId: string, dto: CreateBarbershopDto) {
    const slug = await this.generateSlug(dto.name);

    const shop = await this.prisma.barbershop.create({
      data: {
        ...dto,
        slug,
        ownerId,
        qrSecret: uuidv4(),
      },
    });

    return shop;
  }

  async update(id: string, ownerId: string, dto: UpdateBarbershopDto, userRole?: string) {
    if (userRole !== "ADMIN") {
      await this.validateOwnership(id, ownerId);
    }

    return this.prisma.barbershop.update({
      where: { id },
      data: dto as any,
    });
  }

  async getQrCode(barbershopId: string) {
    const shop = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { id: true, qrSecret: true, name: true },
    });

    if (!shop) throw new NotFoundException("Barbería no encontrada");

    // El QR contiene la info necesaria para unirse a la fila
    const qrData = JSON.stringify({
      barbershopId: shop.id,
      qrSecret: shop.qrSecret,
      action: "join-queue",
    });

    const qrImage = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "H",
      width: 400,
      margin: 2,
    });

    return { qrImage, barbershopId: shop.id, barbershopName: shop.name };
  }

  async regenerateQr(barbershopId: string, ownerId: string, userRole?: string) {
    if (userRole !== "ADMIN") {
      await this.validateOwnership(barbershopId, ownerId);
    }

    const newSecret = uuidv4();
    await this.prisma.barbershop.update({
      where: { id: barbershopId },
      data: { qrSecret: newSecret },
    });

    return this.getQrCode(barbershopId);
  }

  async addService(barbershopId: string, ownerId: string, serviceData: any) {
    await this.validateOwnership(barbershopId, ownerId);
    return this.prisma.service.create({
      data: { ...serviceData, barbershopId },
    });
  }

  async addReview(
    barbershopId: string,
    userId: string,
    rating: number,
    comment?: string,
    appointmentId?: string
  ) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException("La calificación debe estar entre 1 y 5");
    }

    // Buscar el perfil de cliente del usuario
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!clientProfile) throw new BadRequestException("Perfil de cliente no encontrado");
    const clientId = clientProfile.id;

    // Verificar cita completada y obtener barberId
    let barberId: string | undefined;
    let resolvedAppointmentId: string | undefined;

    if (appointmentId) {
      const appointment = await this.prisma.appointment.findFirst({
        where: { id: appointmentId, barbershopId, client: { userId } },
      });
      if (!appointment) throw new BadRequestException("Cita no encontrada");
      if (appointment.status !== "COMPLETED") {
        throw new BadRequestException("Solo puedes calificar después de que tu turno haya finalizado");
      }
      // Verificar que no existe ya una reseña para esta cita
      const existing = await this.prisma.review.findUnique({
        where: { appointmentId },
      });
      if (existing) throw new ConflictException("Ya calificaste esta cita");
      barberId = appointment.barberId;
      resolvedAppointmentId = appointmentId;
    } else {
      // Buscar la última cita completada sin reseña
      const reviewedAppointmentIds = (
        await this.prisma.review.findMany({
          where: { clientId, barbershopId, appointmentId: { not: null } },
          select: { appointmentId: true },
        })
      ).map((r) => r.appointmentId).filter((id): id is string => id !== null);

      const appointment = await this.prisma.appointment.findFirst({
        where: {
          barbershopId,
          client: { userId },
          status: "COMPLETED",
          id: { notIn: reviewedAppointmentIds },
        },
        orderBy: { completedAt: "desc" },
      });

      if (!appointment) {
        throw new BadRequestException("Solo puedes calificar después de ser atendido en esta barbería");
      }

      barberId = appointment.barberId;
      resolvedAppointmentId = appointment.id;
    }

    const review = await this.prisma.review.create({
      data: {
        barbershopId,
        clientId,
        barberId: barberId || undefined,
        appointmentId: resolvedAppointmentId,
        rating,
        comment,
      },
      include: {
        client: { include: { user: { select: { firstName: true, lastName: true } } } },
        barber: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    // Recalcular rating de la barbería
    const shopAggregate = await this.prisma.review.aggregate({
      where: { barbershopId },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.barbershop.update({
      where: { id: barbershopId },
      data: {
        rating: shopAggregate._avg.rating || 0,
        totalReviews: shopAggregate._count,
      },
    });

    // Recalcular rating del barbero si aplica
    if (barberId) {
      const barberAggregate = await this.prisma.review.aggregate({
        where: { barberId },
        _avg: { rating: true },
        _count: true,
      });
      await this.prisma.barberProfile.update({
        where: { id: barberId },
        data: {
          rating: barberAggregate._avg.rating || 0,
          totalReviews: barberAggregate._count,
        },
      });
    }

    return review;
  }

  async addImages(barbershopId: string, ownerId: string, files: Express.Multer.File[], userRole?: string) {
    if (userRole !== "ADMIN") {
      await this.validateOwnership(barbershopId, ownerId);
    }
    const shop = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { images: true },
    });
    if (!shop) throw new NotFoundException("Barbería no encontrada");

    const imageUrls: string[] = [];
    for (const file of files) {
      // Comprimir con sharp
      const compressed = await sharp(file.buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();

      const key = `barbershops/${barbershopId}/${uuidv4()}.jpg`;
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.s3Bucket,
          Key: key,
          Body: compressed,
          ContentType: "image/jpeg",
        })
      );
      imageUrls.push(`https://${this.s3Bucket}.s3.amazonaws.com/${key}`);
    }

    const updated = await this.prisma.barbershop.update({
      where: { id: barbershopId },
      data: { images: [...shop.images, ...imageUrls] },
    });
    return { images: updated.images };
  }

  async removeImage(barbershopId: string, ownerId: string, imageUrl: string, userRole?: string) {
    if (userRole !== "ADMIN") {
      await this.validateOwnership(barbershopId, ownerId);
    }
    const shop = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { images: true },
    });
    if (!shop) throw new NotFoundException("Barbería no encontrada");

    // Eliminar de S3 si es una URL de S3
    if (imageUrl.includes("s3.amazonaws.com")) {
      try {
        const url = new URL(imageUrl);
        const key = url.pathname.substring(1); // remove leading /
        await this.s3.send(new DeleteObjectCommand({ Bucket: this.s3Bucket, Key: key }));
      } catch { /* ignore S3 errors */ }
    }

    const updated = await this.prisma.barbershop.update({
      where: { id: barbershopId },
      data: { images: shop.images.filter((img) => img !== imageUrl) },
    });
    return { images: updated.images };
  }

  private async validateOwnership(barbershopId: string, ownerId: string) {
    const shop = await this.prisma.barbershop.findFirst({
      where: { id: barbershopId, ownerId },
    });

    if (!shop) {
      throw new ForbiddenException(
        "No tienes permiso para modificar esta barbería"
      );
    }
    return shop;
  }

  private async generateSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[áàä]/g, "a")
      .replace(/[éèë]/g, "e")
      .replace(/[íìï]/g, "i")
      .replace(/[óòö]/g, "o")
      .replace(/[úùü]/g, "u")
      .replace(/ñ/g, "n")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    let slug = base;
    let counter = 1;

    while (await this.prisma.barbershop.findUnique({ where: { slug } })) {
      slug = `${base}-${counter}`;
      counter++;
    }

    return slug;
  }
}
