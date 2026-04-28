import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BarberService {
  constructor(private prisma: PrismaService) {}

  /** Obtiene el perfil del barbero con su barbería asignada */
  async getMyProfile(userId: string) {
    const profile = await this.prisma.barberProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            status: true,
          },
        },
        barbershop: {
          include: {
            services: { where: { isActive: true }, orderBy: { name: "asc" } },
            subscription: { include: { plan: true } },
            _count: { select: { appointments: true, queueEntries: true } },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException("Perfil de barbero no encontrado");
    }

    return profile;
  }

  /** Verifica que el barbero pertenece a la barbería */
  private async verifyBarberBelongsToBarbershop(
    userId: string,
    barbershopId: string
  ) {
    const profile = await this.prisma.barberProfile.findFirst({
      where: { userId, barbershopId },
    });
    if (!profile) {
      throw new ForbiddenException(
        "No tienes permiso para gestionar esta barbería"
      );
    }
    return profile;
  }

  // ─── Servicios ────────────────────────────────────────────────

  async getMyServices(userId: string) {
    const profile = await this.prisma.barberProfile.findUnique({
      where: { userId },
      select: { id: true, barbershopId: true },
    });
    if (!profile?.barbershopId) return [];

    return this.prisma.service.findMany({
      where: { barberId: profile.id, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  /** Servicios activos de un barbero específico (para el cliente al reservar) */
  async getServicesByBarber(barberId: string) {
    return this.prisma.service.findMany({
      where: { barberId, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async createService(
    userId: string,
    dto: {
      name: string;
      description?: string;
      durationMinutes: number;
      price: number;
    }
  ) {
    const profile = await this.prisma.barberProfile.findUnique({
      where: { userId },
      select: { id: true, barbershopId: true },
    });
    if (!profile?.barbershopId) {
      throw new ForbiddenException(
        "Debes estar asignado a una barbería para crear servicios"
      );
    }

    return this.prisma.service.create({
      data: {
        ...dto,
        barbershopId: profile.barbershopId,
        barberId: profile.id,
      },
    });
  }

  async updateService(
    userId: string,
    serviceId: string,
    dto: {
      name?: string;
      description?: string;
      durationMinutes?: number;
      price?: number;
      isActive?: boolean;
    }
  ) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) throw new NotFoundException("Servicio no encontrado");

    await this.verifyBarberBelongsToBarbershop(userId, service.barbershopId);

    return this.prisma.service.update({
      where: { id: serviceId },
      data: dto,
    });
  }

  async deleteService(userId: string, serviceId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) throw new NotFoundException("Servicio no encontrado");

    await this.verifyBarberBelongsToBarbershop(userId, service.barbershopId);

    // Soft delete
    return this.prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    });
  }

  // ─── Estadísticas básicas ─────────────────────────────────────

  async getMyStats(userId: string) {
    const profile = await this.prisma.barberProfile.findUnique({
      where: { userId },
      select: { barbershopId: true, id: true },
    });
    if (!profile?.barbershopId) {
      return { todayAppointments: 0, monthAppointments: 0, services: 0 };
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayAppointments, monthAppointments, services] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          barbershopId: profile.barbershopId,
          barberId: profile.id,
          scheduledAt: { gte: startOfToday },
        },
      }),
      this.prisma.appointment.count({
        where: {
          barbershopId: profile.barbershopId,
          barberId: profile.id,
          scheduledAt: { gte: startOfMonth },
        },
      }),
      this.prisma.service.count({
        where: { barbershopId: profile.barbershopId, isActive: true },
      }),
    ]);

    return { todayAppointments, monthAppointments, services };
  }

  // ─── Citas del barbero ────────────────────────────────────────

  async getMyAppointments(userId: string, page = 1, limit = 20) {
    const profile = await this.prisma.barberProfile.findUnique({
      where: { userId },
      select: { id: true, barbershopId: true },
    });
    if (!profile?.barbershopId) return { data: [], total: 0 };

    const where = {
      barberId: profile.id,
      barbershopId: profile.barbershopId,
    };

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: {
          service: { select: { name: true, price: true, durationMinutes: true } },
          client: {
            include: {
              user: { select: { firstName: true, lastName: true, phone: true } },
            },
          },
        },
        orderBy: { scheduledAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
