import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { GeoService } from "../geo/geo.service";

@Processor("virtual-queue")
export class QueueProcessor {
  private readonly logger = new Logger(QueueProcessor.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private geo: GeoService
  ) {}

  @Process("check-geofence")
  async checkGeofence(job: Job<{ entryId: string; barbershopId: string }>) {
    const { entryId, barbershopId } = job.data;

    const entry = await this.prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: {
        barbershop: true,
        client: { include: { user: true } },
      },
    });

    if (!entry || entry.status !== "WAITING") {
      // Si ya no está en fila, cancelar el job repetitivo
      return { skip: true };
    }

    // Si no ha actualizado su ubicación en más de 5 minutos
    const locationAge = entry.lastLocationUpdatedAt
      ? (Date.now() - entry.lastLocationUpdatedAt.getTime()) / 1000
      : Infinity;

    if (locationAge > 300) {
      // 5 minutos sin actualizar = posiblemente alejado
      const fcmToken = entry.client.user.fcmToken;
      if (fcmToken) {
        await this.notifications.sendPush({
          token: fcmToken,
          title: "¿Sigues cerca?",
          body: "Abre la app para confirmar que estás cerca de la barbería",
          data: {
            type: "QUEUE_GEOFENCE_WARNING",
            entryId,
            action: "UPDATE_LOCATION",
          },
        });
      }
      this.logger.warn(
        `Entry ${entryId}: No location update for ${Math.round(locationAge)}s`
      );
    }

    return { checked: true, locationAge };
  }

  @Process("send-appointment-reminder")
  async sendAppointmentReminder(
    job: Job<{ appointmentId: string; minutesBefore: number }>
  ) {
    const { appointmentId, minutesBefore } = job.data;

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: { include: { user: true } },
        barbershop: true,
        service: true,
      },
    });

    if (!appointment || appointment.status !== "CONFIRMED") return;

    const fcmToken = appointment.client.user.fcmToken;
    if (fcmToken) {
      await this.notifications.sendPush({
        token: fcmToken,
        title: `Recordatorio: cita en ${minutesBefore} minutos`,
        body: `Tu cita de ${appointment.service.name} en ${appointment.barbershop.name} es pronto`,
        data: {
          type: "APPOINTMENT_REMINDER",
          appointmentId,
        },
      });
    }

    this.logger.log(
      `Appointment reminder sent for ${appointmentId} (${minutesBefore}min before)`
    );
  }

  @Process("check-subscription-expiry")
  async checkSubscriptionExpiry(
    job: Job<{ subscriptionId: string; daysUntilExpiry: number }>
  ) {
    const { subscriptionId, daysUntilExpiry } = job.data;

    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        barbershop: {
          include: { owner: true },
        },
        plan: true,
      },
    });

    if (!sub || sub.status !== "ACTIVE") return;

    const fcmToken = sub.barbershop.owner.fcmToken;
    if (fcmToken) {
      await this.notifications.sendPush({
        token: fcmToken,
        title: `Tu suscripción vence en ${daysUntilExpiry} días`,
        body: `Renueva tu plan ${sub.plan?.toString() || ""} para seguir usando BarberProSuite`,
        data: {
          type: "SUBSCRIPTION_EXPIRING_SOON",
          subscriptionId,
          daysUntilExpiry: String(daysUntilExpiry),
        },
      });
    }

    this.logger.log(
      `Subscription expiry warning sent: ${subscriptionId} (${daysUntilExpiry} days)`
    );
  }
}
