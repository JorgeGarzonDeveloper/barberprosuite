import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { GeoService } from "../geo/geo.service";
import { JoinQueueDto } from "./dto/join-queue.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { QueueStatus } from "@prisma/client";

const GEOFENCE_RADIUS_METERS = 500;
const GEOFENCE_WARNING_THRESHOLD = 450; // Advertencia a 450m
const LOCATION_CHECK_INTERVAL_SECONDS = 30;

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private geo: GeoService,
    @InjectQueue("virtual-queue") private queueBull: Queue
  ) {}

  /** Barberos disponibles en una barbería (para que el cliente elija) */
  async getAvailableBarbers(barbershopId: string) {
    const barbers = await this.prisma.barberProfile.findMany({
      where: { barbershopId, isAvailable: true },
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
        queueEntries: {
          where: { status: { in: ["WAITING", "IN_SERVICE"] } },
          select: { id: true },
        },
      },
    });

    return barbers.map((b) => ({
      id: b.id,
      firstName: b.user.firstName,
      lastName: b.user.lastName,
      avatarUrl: b.user.avatarUrl,
      specialties: b.specialties,
      rating: b.rating,
      queueLength: b.queueEntries.length,
      estimatedWaitMinutes: b.queueEntries.length * 30,
    }));
  }

  /** Cola del barbero autenticado */
  async getBarberQueue(userId: string) {
    const barberProfile = await this.prisma.barberProfile.findUnique({
      where: { userId },
      include: { barbershop: { select: { name: true } } },
    });
    if (!barberProfile) throw new NotFoundException("Perfil de barbero no encontrado");

    const entries = await this.prisma.queueEntry.findMany({
      where: {
        barbershopId: barberProfile.barbershopId!,
        barberId: barberProfile.id,
        status: { in: ["WAITING", "IN_SERVICE"] },
      },
      include: {
        client: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
      },
      orderBy: { position: "asc" },
    });

    return {
      barbershopName: barberProfile.barbershop?.name,
      totalWaiting: entries.filter((e) => e.status === "WAITING").length,
      inService: entries.find((e) => e.status === "IN_SERVICE") ?? null,
      queue: entries.map((e) => this.formatEntry(e)),
    };
  }

  /** El barbero llama al siguiente de su propia cola */
  async callNextForBarber(userId: string) {
    const barberProfile = await this.prisma.barberProfile.findUnique({ where: { userId } });
    if (!barberProfile) throw new NotFoundException("Perfil de barbero no encontrado");
    return this.callNext(barberProfile.barbershopId!, barberProfile.id);
  }

  /** El barbero completa el turno actual */
  async completeCurrentService(userId: string) {
    const barberProfile = await this.prisma.barberProfile.findUnique({ where: { userId } });
    if (!barberProfile) throw new NotFoundException("Perfil de barbero no encontrado");

    const current = await this.prisma.queueEntry.findFirst({
      where: { barberId: barberProfile.id, status: "IN_SERVICE" },
    });
    if (!current) throw new NotFoundException("No tienes un turno en curso");

    return this.completeService(current.id, barberProfile.barbershopId!);
  }

  async getMyEntry(userId: string) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!clientProfile) return null;

    const entry = await this.prisma.queueEntry.findFirst({
      where: {
        clientId: clientProfile.id,
        status: { in: ["WAITING", "IN_SERVICE"] },
      },
      include: {
        client: { include: { user: true } },
        barbershop: { select: { name: true } },
        barber: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { joinedAt: "desc" },
    });

    if (!entry) return null;

    return {
      ...this.formatEntry(entry),
      barbershopName: entry.barbershop.name,
    };
  }

  async getQueue(barbershopId: string) {
    const [shop, entries] = await Promise.all([
      this.prisma.barbershop.findUnique({
        where: { id: barbershopId },
        select: { name: true, workingHours: true, isActive: true },
      }),
      this.prisma.queueEntry.findMany({
        where: { barbershopId, status: { in: ["WAITING", "IN_SERVICE"] } },
        include: {
          client: {
            include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
          },
        },
        orderBy: { position: "asc" },
      }),
    ]);

    if (!shop) throw new NotFoundException("Barbería no encontrada");

    const totalWaiting = entries.filter((e) => e.status === "WAITING").length;
    const avgServiceTime = 30; // minutos por persona (configurable)

    return {
      barbershopId,
      barbershopName: shop.name,
      totalWaiting,
      estimatedWaitMinutes: totalWaiting * avgServiceTime,
      entries: entries.map((e) => this.formatEntry(e)),
      isOpen: shop.isActive,
    };
  }

  async joinQueue(userId: string, dto: JoinQueueDto) {
    // Resolver el ClientProfile a partir del userId del JWT
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!clientProfile) {
      throw new BadRequestException("Perfil de cliente no encontrado");
    }
    const clientId = clientProfile.id;

    // Validar QR secret
    const shop = await this.prisma.barbershop.findFirst({
      where: { id: dto.barbershopId, qrSecret: dto.qrSecret, isActive: true },
    });

    if (!shop) {
      throw new BadRequestException("QR inválido o barbería no encontrada");
    }

    // Verificar si el cliente ya está en la fila
    const alreadyInQueue = await this.prisma.queueEntry.findFirst({
      where: {
        clientId,
        barbershopId: dto.barbershopId,
        status: { in: ["WAITING", "IN_SERVICE"] },
      },
    });

    if (alreadyInQueue) {
      throw new ConflictException("Ya estás en la fila de esta barbería");
    }

    // Validar que el cliente esté dentro del radio de la barbería
    const distance = this.geo.calculateDistance(
      { lat: dto.latitude, lng: dto.longitude },
      { lat: shop.latitude, lng: shop.longitude }
    );

    if (distance > GEOFENCE_RADIUS_METERS) {
      throw new BadRequestException(
        `Debes estar a menos de ${GEOFENCE_RADIUS_METERS}m de la barbería para unirte a la fila (estás a ${Math.round(distance)}m)`
      );
    }

    // Validar que el barbero preferido exista y pertenezca a la barbería
    let resolvedBarberId: string | undefined;
    if (dto.preferredBarberId) {
      const barber = await this.prisma.barberProfile.findFirst({
        where: { id: dto.preferredBarberId, barbershopId: dto.barbershopId, isAvailable: true },
      });
      if (!barber) throw new BadRequestException("Barbero no disponible");
      resolvedBarberId = barber.id;
    }

    // Calcular posición en la fila (scoped al barbero si aplica)
    const queueFilter = resolvedBarberId
      ? { barbershopId: dto.barbershopId, barberId: resolvedBarberId, status: { in: ["WAITING" as const, "IN_SERVICE" as const] } }
      : { barbershopId: dto.barbershopId, status: { in: ["WAITING" as const, "IN_SERVICE" as const] } };

    const lastEntry = await this.prisma.queueEntry.findFirst({
      where: queueFilter,
      orderBy: { position: "desc" },
    });

    const position = (lastEntry?.position ?? 0) + 1;
    const waitingAhead = position - 1;
    const estimatedWaitMinutes = waitingAhead * 30;

    const entry = await this.prisma.queueEntry.create({
      data: {
        barbershopId: dto.barbershopId,
        clientId,
        barberId: resolvedBarberId ?? null,
        position,
        estimatedWaitMinutes,
        status: QueueStatus.WAITING,
        lastLocationLat: dto.latitude,
        lastLocationLng: dto.longitude,
        lastLocationUpdatedAt: new Date(),
      },
      include: {
        client: { include: { user: true } },
        barbershop: true,
      },
    });

    // Programar verificación de geofence (fire-and-forget: no bloquea la respuesta HTTP)
    this.queueBull
      .add(
        "check-geofence",
        { entryId: entry.id, barbershopId: dto.barbershopId },
        {
          delay: LOCATION_CHECK_INTERVAL_SECONDS * 1000,
          repeat: { every: LOCATION_CHECK_INTERVAL_SECONDS * 1000 },
          jobId: `geofence-${entry.id}`,
        }
      )
      .catch((err) => {
        this.logger.warn(`No se pudo programar geofence para entry ${entry.id}: ${err?.message}`);
      });

    const clientUser = entry.client.user;

    // Notificar al cliente (con persistencia en BD)
    await this.notifications.notify(
      clientUser.id,
      "QUEUE_JOINED",
      "Unido a la fila",
      `Estás en la posición #${position} de ${entry.barbershop.name}. Espera aprox. ${estimatedWaitMinutes} min.`,
      { type: "QUEUE_JOINED", entryId: entry.id, barbershopId: dto.barbershopId, position: String(position) },
      clientUser.fcmToken ?? dto.fcmToken,
    );

    const clientName = `${clientUser.firstName} ${clientUser.lastName}`;

    if (resolvedBarberId) {
      // Notificar al barbero específico elegido
      const barber = await this.prisma.barberProfile.findUnique({
        where: { id: resolvedBarberId },
        include: { user: { select: { id: true, fcmToken: true } } },
      });
      if (barber) {
        await this.notifications.notify(
          barber.user.id,
          "QUEUE_CLIENT_JOINED",
          "Nuevo cliente en tu fila",
          `${clientName} se unió a tu fila en la posición #${position}.`,
          { type: "QUEUE_CLIENT_JOINED", entryId: entry.id, barbershopId: dto.barbershopId },
          barber.user.fcmToken ?? undefined,
        );
      }
    } else {
      // Notificar a todos los barberos disponibles de la barbería
      const allBarbers = await this.prisma.barberProfile.findMany({
        where: { barbershopId: dto.barbershopId, isAvailable: true },
        include: { user: { select: { id: true, fcmToken: true } } },
      });
      for (const barber of allBarbers) {
        await this.notifications.notify(
          barber.user.id,
          "QUEUE_CLIENT_JOINED",
          "Nuevo cliente en la fila",
          `${clientName} se unió a la fila general. Posición #${position}.`,
          { type: "QUEUE_CLIENT_JOINED", entryId: entry.id, barbershopId: dto.barbershopId },
          barber.user.fcmToken ?? undefined,
        );
      }
    }

    this.logger.log(
      `Cliente ${clientId} unido a fila de ${shop.name} en posición ${position}`
    );

    return this.formatEntry(entry);
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!clientProfile) throw new NotFoundException("Perfil de cliente no encontrado");
    const clientId = clientProfile.id;

    const entry = await this.prisma.queueEntry.findFirst({
      where: { id: dto.queueEntryId, clientId, status: "WAITING" },
      include: { barbershop: true, client: { include: { user: true } } },
    });

    if (!entry) {
      throw new NotFoundException("Entrada en fila no encontrada");
    }

    const distance = this.geo.calculateDistance(
      { lat: dto.latitude, lng: dto.longitude },
      { lat: entry.barbershop.latitude, lng: entry.barbershop.longitude }
    );

    const updatedEntry = await this.prisma.queueEntry.update({
      where: { id: entry.id },
      data: {
        lastLocationLat: dto.latitude,
        lastLocationLng: dto.longitude,
        lastLocationUpdatedAt: new Date(),
      },
    });

    // Verificar geofence
    if (distance > GEOFENCE_RADIUS_METERS) {
      await this.handleGeofenceLost(entry);
    } else if (distance > GEOFENCE_WARNING_THRESHOLD) {
      await this.handleGeofenceWarning(entry, distance);
    }

    return {
      entryId: entry.id,
      distanceMeters: Math.round(distance),
      isInGeofence: distance <= GEOFENCE_RADIUS_METERS,
      warningThreshold: GEOFENCE_WARNING_THRESHOLD,
    };
  }

  async callNext(barbershopId: string, barberId?: string) {
    const nextEntry = await this.prisma.queueEntry.findFirst({
      where: { barbershopId, status: "WAITING" },
      orderBy: { position: "asc" },
      include: { client: { include: { user: true } } },
    });

    if (!nextEntry) {
      throw new NotFoundException("No hay clientes en espera");
    }

    const updated = await this.prisma.queueEntry.update({
      where: { id: nextEntry.id },
      data: {
        status: QueueStatus.IN_SERVICE,
        barberId,
        calledAt: new Date(),
      },
    });

    // Notificar al cliente que es su turno
    await this.notifications.notify(
      nextEntry.client.user.id,
      "QUEUE_CALLED",
      "¡Es tu turno!",
      "El barbero está listo para atenderte. Acércate a la silla.",
      { type: "QUEUE_CALLED", entryId: nextEntry.id },
      nextEntry.client.user.fcmToken ?? undefined,
    );

    // Actualizar posiciones y notificar a los demás
    await this.updateQueuePositions(barbershopId);

    return this.formatEntry(updated);
  }

  async completeService(entryId: string, barbershopId: string) {
    const entry = await this.prisma.queueEntry.update({
      where: { id: entryId },
      data: {
        status: QueueStatus.COMPLETED,
        servedAt: new Date(),
      },
      include: {
        client: { include: { user: { select: { id: true, fcmToken: true, firstName: true } } } },
        barbershop: { select: { name: true } },
        barber: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    // Cancelar job de geofence
    const jobs = await this.queueBull.getRepeatableJobs();
    const job = jobs.find((j) => j.id === `geofence-${entryId}`);
    if (job) {
      await this.queueBull.removeRepeatableByKey(job.key);
    }

    await this.updateQueuePositions(barbershopId);

    // Notificar al cliente que su servicio terminó
    const clientUser = entry.client?.user;
    if (clientUser) {
      const barberName = entry.barber
        ? `${entry.barber.user.firstName} ${entry.barber.user.lastName}`
        : "tu barbero";
      await this.notifications.notify(
        clientUser.id,
        "SERVICE_COMPLETED",
        "¡Tu corte está listo! ✂️",
        `${entry.barbershop.name} terminó tu atención. ¿Cómo te fue con ${barberName}?`,
        {
          type: "SERVICE_COMPLETED",
          barbershopId,
          queueEntryId: entryId,
        },
        clientUser.fcmToken ?? undefined,
      );
    }

    return entry;
  }

  async leaveQueue(userId: string, entryId: string) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!clientProfile) throw new NotFoundException("Perfil de cliente no encontrado");
    const clientId = clientProfile.id;

    const entry = await this.prisma.queueEntry.findFirst({
      where: { id: entryId, clientId, status: { in: ["WAITING", "IN_SERVICE"] } },
    });

    if (!entry) throw new NotFoundException("No estás en esta fila");

    await this.prisma.queueEntry.update({
      where: { id: entry.id },
      data: { status: QueueStatus.CANCELLED },
    });

    // Cancelar geofence job
    const jobs = await this.queueBull.getRepeatableJobs();
    const job = jobs.find((j) => j.id === `geofence-${entryId}`);
    if (job) {
      await this.queueBull.removeRepeatableByKey(job.key);
    }

    // Notificar al barbero asignado que el cliente abandonó
    if (entry.barberId) {
      const barber = await this.prisma.barberProfile.findUnique({
        where: { id: entry.barberId },
        include: { user: { select: { id: true, fcmToken: true } } },
      });
      const clientUser = await this.prisma.clientProfile.findUnique({
        where: { id: clientId },
        include: { user: { select: { firstName: true, lastName: true } } },
      });
      if (barber) {
        const clientName = clientUser
          ? `${clientUser.user.firstName} ${clientUser.user.lastName}`
          : "Un cliente";
        await this.notifications.notify(
          barber.user.id,
          "QUEUE_CLIENT_LEFT",
          "Cliente abandonó la fila",
          `${clientName} salió de tu fila.`,
          { type: "QUEUE_CLIENT_LEFT", barbershopId: entry.barbershopId },
          barber.user.fcmToken ?? undefined,
        );
      }
    }

    await this.updateQueuePositions(entry.barbershopId);
  }

  private async handleGeofenceLost(entry: any) {
    await this.prisma.queueEntry.update({
      where: { id: entry.id },
      data: { status: QueueStatus.GEOFENCE_LOST },
    });

    await this.notifications.notify(
      entry.client.user.id,
      "QUEUE_GEOFENCE_LOST",
      "Perdiste tu lugar en la fila",
      `Te alejaste más de ${GEOFENCE_RADIUS_METERS}m de ${entry.barbershop.name}. Tu lugar fue liberado.`,
      { type: "QUEUE_GEOFENCE_LOST", entryId: entry.id },
      entry.client.user.fcmToken ?? undefined,
    );

    await this.updateQueuePositions(entry.barbershopId);
    this.logger.warn(
      `Cliente ${entry.clientId} perdió su lugar en fila por geofence`
    );
  }

  private async handleGeofenceWarning(entry: any, distance: number) {
    if (entry.geofenceWarningsSent >= 3) return;

    await this.prisma.queueEntry.update({
      where: { id: entry.id },
      data: { geofenceWarningsSent: { increment: 1 } },
    });

    const fcmToken = entry.client.user.fcmToken;
    if (fcmToken) {
      await this.notifications.sendPush({
        token: fcmToken,
        title: "Advertencia: te estás alejando",
        body: `Estás a ${Math.round(distance)}m de ${entry.barbershop.name}. Si pasas ${GEOFENCE_RADIUS_METERS}m, perderás tu lugar.`,
        data: {
          type: "QUEUE_GEOFENCE_WARNING",
          entryId: entry.id,
          distance: String(Math.round(distance)),
        },
      });
    }
  }

  private async updateQueuePositions(barbershopId: string) {
    const waitingEntries = await this.prisma.queueEntry.findMany({
      where: { barbershopId, status: "WAITING" },
      orderBy: [{ joinedAt: "asc" }],
      include: { client: { include: { user: true } } },
    });

    // Actualizar posiciones secuencialmente
    await Promise.all(
      waitingEntries.map((entry, index) =>
        this.prisma.queueEntry.update({
          where: { id: entry.id },
          data: {
            position: index + 1,
            estimatedWaitMinutes: index * 30,
          },
        })
      )
    );

    // Notificar a cada cliente de su nueva posición (excepto el primero, ya recibe QUEUE_CALLED)
    for (let i = 0; i < waitingEntries.length; i++) {
      if (i === 0) continue;
      const entry = waitingEntries[i];
      await this.notifications.notify(
        entry.client.user.id,
        "QUEUE_POSITION_UPDATED",
        "Actualización de fila",
        `Ahora eres el #${i + 1} en la fila. Espera aprox. ${i * 30} min.`,
        { type: "QUEUE_POSITION_UPDATED", entryId: entry.id, position: String(i + 1), estimatedWaitMinutes: String(i * 30) },
        entry.client.user.fcmToken ?? undefined,
      );
    }
  }

  private formatEntry(entry: any) {
    return {
      id: entry.id,
      barbershopId: entry.barbershopId,
      clientId: entry.clientId,
      barberId: entry.barberId,
      position: entry.position,
      estimatedWaitMinutes: entry.estimatedWaitMinutes,
      status: entry.status,
      joinedAt: entry.joinedAt,
      calledAt: entry.calledAt,
      servedAt: entry.servedAt,
      clientName: entry.client?.user
        ? `${entry.client.user.firstName} ${entry.client.user.lastName}`
        : undefined,
      clientAvatarUrl: entry.client?.user?.avatarUrl,
      barberName: entry.barber?.user
        ? `${entry.barber.user.firstName} ${entry.barber.user.lastName}`
        : undefined,
    };
  }
}
