import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { GeoService } from "../geo/geo.service";
import { CreateBarbershopDto } from "./dto/create-barbershop.dto";
import { UpdateBarbershopDto } from "./dto/update-barbershop.dto";
import * as QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class BarbershopsService {
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

  async findAll(page = 1, limit = 20, search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as any } },
            { city: { contains: search, mode: "insensitive" as any } },
            { address: { contains: search, mode: "insensitive" as any } },
          ],
        }
      : {};

    const [shops, total] = await Promise.all([
      this.prisma.barbershop.findMany({
        where: { ...where, isActive: true },
        include: { services: { where: { isActive: true } } },
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
          take: 10,
          include: {
            client: { include: { user: { select: { firstName: true, avatarUrl: true } } } },
          },
        },
      },
    });

    if (!shop) throw new NotFoundException("Barbería no encontrada");
    return shop;
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
    clientId: string,
    rating: number,
    comment?: string
  ) {
    const review = await this.prisma.review.create({
      data: { barbershopId, clientId, rating, comment },
    });

    // Recalcular rating promedio
    const aggregate = await this.prisma.review.aggregate({
      where: { barbershopId },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.barbershop.update({
      where: { id: barbershopId },
      data: {
        rating: aggregate._avg.rating || 0,
        totalReviews: aggregate._count,
      },
    });

    return review;
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
