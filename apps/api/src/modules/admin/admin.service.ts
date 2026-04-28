import { Injectable, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, totalBarbershops, totalAppointments, revenue] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.barbershop.count({ where: { isActive: true } }),
        this.prisma.appointment.count(),
        this.prisma.payment.aggregate({
          where: { status: "APPROVED" },
          _sum: { amount: true },
        }),
      ]);

    const activeSubscriptions = await this.prisma.subscription.count({
      where: { status: { in: ["ACTIVE", "TRIAL"] } },
    });

    const newUsersThisMonth = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    return {
      totalUsers,
      totalBarbershops,
      totalAppointments,
      activeSubscriptions,
      newUsersThisMonth,
      totalRevenue: revenue._sum.amount || 0,
    };
  }

  async getAllUsers(page = 1, limit = 20, role?: string, search?: string) {
    const where = {
      ...(role ? { role: role as any } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" as any } },
              { firstName: { contains: search, mode: "insensitive" as any } },
              { lastName: { contains: search, mode: "insensitive" as any } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          barberProfile: { select: { barbershop: { select: { name: true } } } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAllBarbershops(page = 1, limit = 20) {
    const [shops, total] = await Promise.all([
      this.prisma.barbershop.findMany({
        include: {
          owner: { select: { firstName: true, lastName: true, email: true } },
          subscription: { include: { plan: true } },
          _count: { select: { barbers: true, appointments: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.barbershop.count(),
    ]);

    return { data: shops, total, page, limit };
  }

  async createBarber(dto: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });
    if (exists) {
      throw new ConflictException(
        exists.email === dto.email
          ? "Ya existe un usuario con ese correo"
          : "Ya existe un usuario con ese teléfono"
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: "BARBER",
        status: "PENDING_VERIFICATION",
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, status: true, createdAt: true,
      },
    });

    // Crear perfil de barbero vacío
    await this.prisma.barberProfile.create({ data: { userId: user.id } });

    return user;
  }

  async updateUserStatus(userId: string, status: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
      select: { id: true, email: true, status: true },
    });
  }

  async getRevenueByMonth() {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const revenue = await this.prisma.payment.aggregate({
        where: {
          status: "APPROVED",
          createdAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });

      months.push({
        month: start.toLocaleString("es-CO", { month: "long", year: "numeric" }),
        revenue: revenue._sum.amount || 0,
      });
    }
    return months;
  }

  async getAllSubscriptions(page = 1, limit = 20) {
    const [subs, total] = await Promise.all([
      this.prisma.subscription.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          plan: true,
          barbershop: { select: { name: true, city: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.subscription.count(),
    ]);
    return { data: subs, total, page, limit };
  }

  async assignBarberToBarbershop(userId: string, barbershopId: string) {
    // Upsert barber profile with barbershop
    await this.prisma.barberProfile.upsert({
      where: { userId },
      create: { userId, barbershopId },
      update: { barbershopId },
    });

    // Link pending user subscription to the barbershop
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, barbershopId: null },
    });
    if (sub) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { barbershopId, status: "ACTIVE" },
      });
    }

    // Activate user
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" },
    });

    return { success: true, message: "Barbero asignado correctamente" };
  }
}
