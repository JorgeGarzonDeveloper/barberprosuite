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
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const [allPayments, newUsersCount] = await Promise.all([
        this.prisma.payment.findMany({
          where: { status: "APPROVED", createdAt: { gte: start, lte: end } },
          select: { amount: true, commissionAmount: true, subscriptionId: true, appointmentId: true },
        }),
        this.prisma.user.count({
          where: { createdAt: { gte: start, lte: end } },
        }),
      ]);

      const subscriptionRevenue = allPayments
        .filter((p) => p.subscriptionId)
        .reduce((s, p) => s + (p.amount || 0), 0);

      const commissionRevenue = allPayments
        .filter((p) => p.appointmentId)
        .reduce((s, p) => s + (p.commissionAmount || 0), 0);

      months.push({
        month: start.toLocaleString("es-CO", { month: "short", year: "2-digit" }),
        revenue: subscriptionRevenue + commissionRevenue,
        subscriptionRevenue,
        commissionRevenue,
        newUsers: newUsersCount,
      });
    }
    return months;
  }

  async getRevenueBreakdown() {
    const [subPayments, apptPayments, pendingRefunds, approvedRefunds, totalAppts, cancelledAppts] = await Promise.all([
      // Suscripciones pagadas
      this.prisma.payment.aggregate({
        where: { status: "APPROVED", subscriptionId: { not: null } },
        _sum: { amount: true },
        _count: true,
      }),
      // Pagos de citas (50% depósito + 10% comisión)
      this.prisma.payment.aggregate({
        where: { status: "APPROVED", appointmentId: { not: null } },
        _sum: { amount: true, commissionAmount: true, barberAmount: true },
        _count: true,
      }),
      // Devoluciones PENDIENTES
      this.prisma.supportTicket.count({
        where: {
          subject: { contains: "devoluci", mode: "insensitive" },
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
      }),
      // Devoluciones APROBADAS (resueltas)
      this.prisma.supportTicket.count({
        where: {
          subject: { contains: "devoluci", mode: "insensitive" },
          status: "RESOLVED",
        },
      }),
      // Citas completadas
      this.prisma.appointment.count({ where: { status: "COMPLETED" } }),
      // Citas canceladas
      this.prisma.appointment.count({ where: { status: "CANCELLED" } }),
    ]);

    const subscriptionRevenue = subPayments._sum.amount || 0;
    const commissionRevenue   = apptPayments._sum.commissionAmount || 0;
    const grossApptRevenue    = apptPayments._sum.amount || 0;          // Todo lo que entró por citas (depósito + comisión)
    const pendingBarberPayouts = apptPayments._sum.barberAmount || 0;   // 50% a transferir a barberos
    const totalPlatformRevenue = subscriptionRevenue + commissionRevenue; // Ganancia neta plataforma

    // Estimación de devoluciones aprobadas (promedio 60% del valor de cita procesado)
    // En producción idealmente habría un monto exacto en el ticket
    const estimatedRefundedAmount = approvedRefunds * 0; // placeholder — se actualizará cuando haya monto en ticket

    return {
      // ── Ingresos brutos ──────────────────────────────────────────
      grossTotalRevenue: subscriptionRevenue + grossApptRevenue,
      subscriptionRevenue,
      grossApptRevenue,

      // ── Desglose por fuente (ganancia plataforma) ─────────────────
      commissionRevenue,         // 10% de cada cita
      totalPlatformRevenue,      // Ganancia neta: suscripciones + comisiones

      // ── Obligaciones con barberos ─────────────────────────────────
      pendingBarberPayouts,      // 50% depósitos a transferir

      // ── Conteos ──────────────────────────────────────────────────
      subscriptionCount: subPayments._count,
      appointmentCount: apptPayments._count,
      completedAppointments: totalAppts,
      cancelledAppointments: cancelledAppts,

      // ── Devoluciones ──────────────────────────────────────────────
      pendingRefunds,
      approvedRefunds,
    };
  }

  async getRefundRequests(page = 1, limit = 20, status?: string) {
    const where = {
      subject: { contains: "devoluci", mode: "insensitive" as any },
      ...(status ? { status: status as any } : {}),
    };

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          replies: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { data: tickets, total, page, limit };
  }

  async processRefundRequest(ticketId: string, action: "approve" | "reject", adminNote?: string) {
    const status = action === "approve" ? "RESOLVED" : "CLOSED";
    const message =
      action === "approve"
        ? `Tu solicitud de devolución fue **aprobada**. ${adminNote || "Procesaremos el reembolso en máximo 2 días hábiles al mismo medio de pago original."}`
        : `Tu solicitud de devolución fue revisada y no puede ser procesada. ${adminNote || "No cumple con los criterios: la cancelación debe hacerse con al menos 2 horas de anticipación a la cita."}`;

    await Promise.all([
      this.prisma.supportReply.create({ data: { ticketId, message, isAdmin: true } }),
      this.prisma.supportTicket.update({ where: { id: ticketId }, data: { status } }),
    ]);

    return { success: true, action, ticketId };
  }

  async getBarberPayouts() {
    const payments = await this.prisma.payment.findMany({
      where: {
        status: "APPROVED",
        appointmentId: { not: null },
        barberAmount: { gt: 0 },
      },
      include: {
        appointment: {
          include: {
            barber: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true, phone: true } },
                barbershop: { select: { name: true } },
              },
            },
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const byBarber: Record<string, any> = {};
    for (const p of payments) {
      const barber = p.appointment?.barber;
      if (!barber) continue;
      const key = barber.id;
      if (!byBarber[key]) {
        byBarber[key] = {
          barberId: barber.id,
          firstName: barber.user.firstName,
          lastName: barber.user.lastName,
          email: barber.user.email,
          phone: barber.user.phone,
          barbershopName: barber.barbershop?.name ?? "—",
          totalOwed: 0,
          transactions: [],
        };
      }
      byBarber[key].totalOwed += p.barberAmount || 0;
      byBarber[key].transactions.push({
        paymentId: p.id,
        date: p.createdAt,
        service: p.appointment?.service?.name ?? "—",
        amount: p.amount,
        barberAmount: p.barberAmount,
        commissionAmount: p.commissionAmount,
      });
    }

    return Object.values(byBarber).sort((a: any, b: any) => b.totalOwed - a.totalOwed);
  }

  async getTransactionsExport() {
    const payments = await this.prisma.payment.findMany({
      where: { status: "APPROVED" },
      include: {
        subscription: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            barbershop: { select: { name: true } },
            plan: { select: { name: true } },
          },
        },
        appointment: {
          include: {
            client: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
            barber: { include: { user: { select: { firstName: true, lastName: true } } } },
            barbershop: { select: { name: true } },
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });

    return payments.map((p) => {
      const isSubscription = !!p.subscriptionId;
      return {
        id: p.id,
        fecha: p.createdAt.toISOString(),
        tipo: isSubscription ? "Suscripción" : "Cita",
        estado: p.status,
        metodo: p.method,
        referencia: p.referenceId ?? "",
        monto_total: p.amount,
        comision_plataforma: p.commissionAmount ?? 0,
        monto_barbero: p.barberAmount ?? 0,
        cliente: isSubscription
          ? `${p.subscription?.user?.firstName ?? ""} ${p.subscription?.user?.lastName ?? ""}`.trim()
          : `${p.appointment?.client?.user?.firstName ?? ""} ${p.appointment?.client?.user?.lastName ?? ""}`.trim(),
        email_cliente: isSubscription
          ? (p.subscription?.user?.email ?? "")
          : (p.appointment?.client?.user?.email ?? ""),
        barbero: isSubscription
          ? ""
          : `${p.appointment?.barber?.user?.firstName ?? ""} ${p.appointment?.barber?.user?.lastName ?? ""}`.trim(),
        barberia: isSubscription
          ? (p.subscription?.barbershop?.name ?? "")
          : (p.appointment?.barbershop?.name ?? ""),
        plan_suscripcion: p.subscription?.plan?.name ?? "",
        servicio: p.appointment?.service?.name ?? "",
      };
    });
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
