import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService
  ) {}

  async getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    });
  }

  async getSubscription(barbershopId: string) {
    return this.prisma.subscription.findUnique({
      where: { barbershopId },
      include: { plan: true },
    });
  }

  async subscribe(barbershopId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException("Plan no encontrado");

    const existing = await this.prisma.subscription.findUnique({
      where: { barbershopId },
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    if (existing) {
      return this.prisma.subscription.update({
        where: { barbershopId },
        data: {
          planId,
          status: "PENDING_PAYMENT",
          startDate,
          endDate,
          renewalDate: endDate,
        },
        include: { plan: true },
      });
    }

    return this.prisma.subscription.create({
      data: {
        barbershopId,
        planId,
        status: "PENDING_PAYMENT",
        startDate,
        endDate,
        renewalDate: endDate,
        autoRenew: true,
      },
      include: { plan: true },
    });
  }

  /**
   * Crear suscripción para un barbero (sin barbershop todavía).
   * El admin luego asigna el barbershop.
   */
  async subscribeUser(userId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException("Plan no encontrado");

    // Verificar si ya tiene suscripción pendiente
    const existing = await this.prisma.subscription.findFirst({
      where: { userId },
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    if (existing) {
      return this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          planId,
          status: "PENDING_PAYMENT",
          startDate,
          endDate,
          renewalDate: endDate,
        },
        include: { plan: true },
      });
    }

    return this.prisma.subscription.create({
      data: {
        userId,
        planId,
        status: "PENDING_PAYMENT",
        startDate,
        endDate,
        renewalDate: endDate,
        autoRenew: true,
      },
      include: { plan: true },
    });
  }

  /**
   * Obtener suscripción por userId
   */
  async getUserSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { userId },
      include: { plan: true },
    });
  }

  /**
   * Activar suscripción después del pago exitoso
   */
  async activateSubscription(subscriptionId: string) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "ACTIVE",
        startDate,
        endDate,
        renewalDate: endDate,
      },
    });
  }

  /**
   * Cron diario: verificar suscripciones próximas a vencer
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkExpiringSubscriptions() {
    this.logger.log("Checking expiring subscriptions...");

    const warningDays = [7, 3, 1];

    for (const days of warningDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const expiring = await this.prisma.subscription.findMany({
        where: {
          status: "ACTIVE",
          endDate: { gte: startOfDay, lte: endOfDay },
          autoRenew: false,
          barbershopId: { not: null },
        },
        include: {
          barbershop: { include: { owner: true } },
          plan: true,
        },
      });

      for (const sub of expiring) {
        if (!sub.barbershop) continue;
        const fcmToken = sub.barbershop.owner?.fcmToken;
        if (fcmToken) {
          await this.notifications.sendPush({
            token: fcmToken,
            title: `Tu suscripción vence en ${days} ${days === 1 ? "día" : "días"}`,
            body: `Renueva tu plan ${sub.plan.displayName} para evitar interrupciones en tu servicio`,
            data: {
              type: "SUBSCRIPTION_EXPIRING_SOON",
              subscriptionId: sub.id,
              daysUntilExpiry: String(days),
            },
          });
        }

        await this.notifications.saveNotification(
          sub.barbershop.ownerId,
          "SUBSCRIPTION_EXPIRING_SOON",
          `Tu suscripción vence en ${days} ${days === 1 ? "día" : "días"}`,
          `Renueva tu plan ${sub.plan.displayName} para evitar interrupciones`
        );
      }

      this.logger.log(`Found ${expiring.length} subs expiring in ${days} days`);
    }

    // Expirar suscripciones vencidas
    const expired = await this.prisma.subscription.updateMany({
      where: {
        status: "ACTIVE",
        endDate: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    if (expired.count > 0) {
      this.logger.log(`Expired ${expired.count} subscriptions`);
    }
  }
}
