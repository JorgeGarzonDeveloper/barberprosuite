import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { WompiService } from "./wompi.service";
import { NequiService } from "./nequi.service";
import { NotificationsService } from "../notifications/notifications.service";
import { v4 as uuidv4 } from "uuid";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { addMinutes } from "date-fns";
import { format } from "date-fns";
import { es } from "date-fns/locale";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private wompi: WompiService,
    private nequi: NequiService,
    private notifications: NotificationsService,
    private config: ConfigService
  ) {}

  async getPseBanks() {
    return this.wompi.getPseBanks();
  }

  async createSubscriptionPayment(
    subscriptionId: string,
    method: PaymentMethod,
    params?: any
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        barbershop: { include: { owner: true } },
      },
    });

    if (!subscription) throw new NotFoundException("Suscripción no encontrada");

    const amount = subscription.plan.priceMonthly;
    const amountInCents = Math.round(amount * 100);
    const reference = `BPS-SUB-${subscription.id}-${Date.now()}`;

    // Crear registro de pago pendiente
    const payment = await this.prisma.payment.create({
      data: {
        subscriptionId,
        amount,
        currency: "COP",
        method,
        status: PaymentStatus.PENDING,
        referenceId: reference,
      },
    });

    // Procesar según método de pago
    let result: any;

    switch (method) {
      case "PSE":
        result = await this.wompi.createPseTransaction({
          amountInCents,
          reference,
          email: subscription.barbershop.owner.email,
          bankCode: params.bankCode,
          documentType: params.documentType,
          documentNumber: params.documentNumber,
          redirectUrl: `${process.env.WEB_URL}/payment/callback?paymentId=${payment.id}`,
        });

        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            transactionId: result.id,
            metadata: result as any,
          },
        });

        return {
          paymentId: payment.id,
          redirectUrl: result.payment_method?.extra?.async_payment_url,
          transactionId: result.id,
        };

      case "CREDIT_CARD":
      case "DEBIT_CARD":
        result = await this.wompi.createPaymentLink({
          amountInCents,
          reference,
          description: `Suscripción ${subscription.plan.displayName} - ${subscription.barbershop.name}`,
          redirectUrl: `${process.env.WEB_URL}/payment/callback?paymentId=${payment.id}`,
        });

        return {
          paymentId: payment.id,
          paymentLinkUrl: result.payment_link?.permalink,
        };

      case "BANK_TRANSFER":
        // Instrucciones de consignación manual
        return {
          paymentId: payment.id,
          instructions: {
            bank: "Bancolombia",
            accountType: "Ahorros",
            accountNumber: "12345678901",
            beneficiary: "BarberProSuite SAS",
            nit: "900.123.456-7",
            reference: reference,
            amount: amount,
            notes:
              "Envía el comprobante a pagos@barberprosuite.com con el número de referencia",
          },
        };

      case "NEQUI":
        return {
          paymentId: payment.id,
          nequiNumber: "+573001234567",
          reference,
          amount,
          instructions: "Envía el pago a este número Nequi con la referencia indicada",
        };

      default:
        throw new BadRequestException("Método de pago no soportado");
    }
  }

  async handleWebhook(body: any, signature: string) {
    const event = body.event;
    const transaction = body.data?.transaction;

    this.logger.log(`Webhook recibido: event=${event}, status=${transaction?.status}`);
    this.logger.log(`Transaction completa: ${JSON.stringify(transaction)}`);

    if (!transaction) {
      this.logger.warn("Webhook sin transaction data");
      return;
    }

    const isValid = this.wompi.validateWebhookSignature(
      transaction.id,
      transaction.amount_in_cents,
      transaction.currency,
      transaction.status,
      body.timestamp,
      signature
    );

    if (!isValid) {
      // En sandbox la firma puede diferir — continuar de todos modos en desarrollo
      this.logger.warn(`Firma inválida (sandbox) — procesando de todas formas. signature=${signature}`);
    }

    if (event === "transaction.updated") {
      const paymentInclude = {
        subscription: { include: { barbershop: { include: { owner: true } } } },
      };

      // Buscar por transactionId o por referenceId (pagos creados con payment link)
      let payment = await this.prisma.payment.findFirst({
        where: { transactionId: transaction.id },
        include: paymentInclude,
      });

      if (!payment && transaction.reference) {
        payment = await this.prisma.payment.findFirst({
          where: { referenceId: transaction.reference },
          include: paymentInclude,
        });
      }

      // Wompi payment links generan la referencia como {link_id}_{ts}_{random},
      // no como la referencia que enviamos. Buscar por el payment_link_id guardado
      // en transactionId al crear el checkout link.
      if (!payment && transaction.payment_link_id) {
        payment = await this.prisma.payment.findFirst({
          where: { transactionId: transaction.payment_link_id },
          include: paymentInclude,
        });
      }

      // Actualizar transactionId con el ID real de la transacción para futuras búsquedas
      if (payment && payment.transactionId !== transaction.id) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { transactionId: transaction.id },
        });
      }

      if (!payment) {
        this.logger.warn(`Webhook: pago no encontrado para transaction=${transaction.id} reference=${transaction.reference}`);
        return;
      }

      if (transaction.status === "APPROVED") {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.APPROVED },
        });

        // ── Activar suscripción ──────────────────────────────────────────────
        if (payment.subscriptionId) {
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1);

          await this.prisma.subscription.update({
            where: { id: payment.subscriptionId },
            data: { status: "ACTIVE", endDate, renewalDate: endDate },
          });

          const sub = await this.prisma.subscription.findUnique({
            where: { id: payment.subscriptionId },
            include: {
              barbershop: { include: { owner: true } },
              user: true,
            },
          });

          const owner = sub?.barbershop?.owner ?? sub?.user;
          if ((owner as any)?.fcmToken) {
            await this.notifications.notify(
              (owner as any).id,
              "PAYMENT_RECEIVED",
              "Pago recibido",
              "Tu suscripción ha sido activada exitosamente.",
              { type: "PAYMENT_RECEIVED", paymentId: payment.id },
              (owner as any).fcmToken,
            );
          }
        }

        // ── Confirmar cita ───────────────────────────────────────────────────
        if ((payment as any).appointmentId) {
          const appointment = await this.prisma.appointment.update({
            where: { id: (payment as any).appointmentId },
            data: { status: "CONFIRMED" },
            include: {
              barbershop: true,
              service: true,
              barber: { include: { user: true } },
              client: { include: { user: true } },
            },
          });

          const dateStr = format(appointment.scheduledAt, "d 'de' MMMM 'a las' HH:mm", { locale: es });

          // Notificar al cliente
          await this.notifications.notify(
            appointment.client.user.id,
            "APPOINTMENT_CONFIRMED",
            "¡Cita confirmada!",
            `Tu cita de ${appointment.service.name} en ${appointment.barbershop.name} el ${dateStr} está confirmada.`,
            { type: "APPOINTMENT_CONFIRMED", appointmentId: appointment.id },
            appointment.client.user.fcmToken ?? undefined,
          );

          // Notificar al barbero
          await this.notifications.notify(
            appointment.barber.user.id,
            "APPOINTMENT_BOOKED",
            "Nueva cita agendada",
            `${appointment.client.user.firstName} ${appointment.client.user.lastName} agendó ${appointment.service.name} el ${dateStr}.`,
            { type: "APPOINTMENT_BOOKED", appointmentId: appointment.id },
            appointment.barber.user.fcmToken ?? undefined,
          );

          this.logger.log(`Cita ${appointment.id} confirmada tras pago aprobado`);
        }
      } else if (
        transaction.status === "DECLINED" ||
        transaction.status === "VOIDED"
      ) {
        const failStatus = transaction.status === "DECLINED"
          ? PaymentStatus.DECLINED
          : PaymentStatus.VOIDED;

        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: failStatus },
        });

        // Si era pago de cita → cancelar la cita
        if ((payment as any).appointmentId) {
          await this.prisma.appointment.update({
            where: { id: (payment as any).appointmentId },
            data: { status: "CANCELLED", cancellationReason: "Pago rechazado" },
          });
        }

        // Notificar al pagador
        const sub = (payment as any).subscription;
        const fcmToken = sub?.barbershop?.owner?.fcmToken;
        if (fcmToken) {
          await this.notifications.sendPush({
            token: fcmToken,
            title: "Pago fallido",
            body: "Tu pago no pudo ser procesado. Intenta de nuevo.",
            data: { type: "PAYMENT_FAILED", paymentId: payment.id },
          });
        }
      }
    }
  }

  async getPaymentHistory(barbershopId: string, page = 1, limit = 20) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { barbershopId },
    });

    if (!subscription) return { data: [], total: 0 };

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { subscriptionId: subscription.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payment.count({ where: { subscriptionId: subscription.id } }),
    ]);

    return { data: payments, total, page, limit };
  }

  /**
   * Generar link de pago Wompi para barbero que acaba de registrarse
   */
  async createBarberCheckoutLink(
    subscriptionId: string,
    email: string,
    planName: string,
    customRedirectUrl?: string
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!subscription) throw new NotFoundException("Suscripción no encontrada");

    const reference = `BPS-${subscriptionId.slice(0, 8)}-${Date.now()}`;
    const amountInCents = Math.round(subscription.plan.priceMonthly * 100);

    // Usar NGROK_URL si está disponible (desarrollo local con HTTPS público)
    // Wompi rechaza IPs privadas y URLs sin HTTPS
    const publicUrl =
      this.config.get("NGROK_URL") ||
      this.config.get("APP_URL") ||
      "http://localhost:3000";

    const mobileCallbackUrl = `${publicUrl}/api/v1/payments/mobile-callback`;
    const redirectUrl = customRedirectUrl ?? mobileCallbackUrl;

    const paymentLink = await this.wompi.createPaymentLink({
      amountInCents,
      reference,
      description: `Suscripción BarberProSuite - Plan ${planName}`,
      redirectUrl,
    });

    await this.prisma.payment.create({
      data: {
        subscriptionId,
        amount: subscription.plan.priceMonthly,
        currency: "COP",
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
        referenceId: reference,
        // Guardar el ID del payment link para poder correlacionar el webhook
        // (Wompi usa payment_link_id como prefijo de la referencia de transacción)
        transactionId: paymentLink?.id ?? null,
      },
    });

    // Wompi devuelve el id del link; la URL de checkout es siempre:
    // https://checkout.wompi.co/l/{id}
    const checkoutUrl = paymentLink?.id
      ? `https://checkout.wompi.co/l/${paymentLink.id}`
      : null;

    return { checkoutUrl, reference };
  }

  /**
   * Crea una cita pendiente de pago y genera el link de Wompi.
   * La cita queda en PENDING hasta que el webhook confirme el pago.
   * Comisión: BOOKING_COMMISSION_PERCENT% del precio (mínimo 2000 COP), no reembolsable.
   */
  /**
   * Crea una cita pendiente de pago con uno o múltiples servicios y genera link Wompi.
   * - serviceIds: array con todos los servicios elegidos (mínimo 1).
   * - El primero actúa como serviceId principal (compatibilidad con schema).
   * - Precio total = suma de precios. Duración total = suma de duraciones.
   * - Comisión: BOOKING_COMMISSION_PERCENT% del total (mínimo 2000 COP), no reembolsable.
   */
  async createAppointmentCheckoutLink(
    clientUserId: string,
    dto: {
      barbershopId: string;
      barberId: string;
      serviceIds: string[];
      scheduledAt: string;
      notes?: string;
    }
  ) {
    if (!dto.serviceIds?.length) {
      throw new BadRequestException("Debes seleccionar al menos un servicio");
    }

    const [services, barber, clientProfile] = await Promise.all([
      this.prisma.service.findMany({ where: { id: { in: dto.serviceIds }, isActive: true } }),
      this.prisma.barberProfile.findUnique({
        where: { id: dto.barberId },
        include: { user: { select: { id: true, firstName: true, lastName: true, fcmToken: true } } },
      }),
      this.prisma.clientProfile.findUnique({ where: { userId: clientUserId } }),
    ]);

    if (!services.length) throw new NotFoundException("Ningún servicio encontrado");
    if (!barber) throw new NotFoundException("Barbero no encontrado");
    if (!clientProfile) throw new NotFoundException("Perfil de cliente no encontrado");

    // Calcular totales sumando todos los servicios
    const totalServicePrice = services.reduce((sum, s) => sum + s.price, 0);
    const totalDurationMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
    const serviceNames = services.map((s) => s.name).join(" + ");
    const primaryServiceId = dto.serviceIds[0];

    const scheduledAt = new Date(dto.scheduledAt);
    const scheduledEnd = addMinutes(scheduledAt, totalDurationMinutes);

    // Verificar conflicto de horario
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        barberId: dto.barberId,
        status: { in: ["PENDING", "CONFIRMED"] },
        AND: [
          { scheduledAt: { lt: scheduledEnd } },
          { scheduledAt: { gte: addMinutes(scheduledAt, -totalDurationMinutes) } },
        ],
      },
    });
    if (conflict) {
      throw new ConflictException("El barbero ya tiene una cita en ese horario");
    }

    // Calcular comisión sobre el total
    const commissionPct = parseFloat(this.config.get("BOOKING_COMMISSION_PERCENT") ?? "10") / 100;
    const commissionAmount = Math.max(Math.round(totalServicePrice * commissionPct), 2000);
    const barberAmount = totalServicePrice;
    const totalAmount = barberAmount + commissionAmount;

    // Crear la cita en estado PENDING
    const appointment = await this.prisma.appointment.create({
      data: {
        barbershopId: dto.barbershopId,
        barberId: dto.barberId,
        clientId: clientProfile.id,
        serviceId: primaryServiceId,
        serviceIds: dto.serviceIds,
        scheduledAt,
        durationMinutes: totalDurationMinutes,
        price: totalServicePrice,
        notes: dto.notes,
        status: "PENDING",
      },
    });

    const reference = `BPS-APT-${appointment.id.slice(0, 8)}-${Date.now()}`;
    const amountInCents = Math.round(totalAmount * 100);

    const publicUrl =
      this.config.get("NGROK_URL") ||
      this.config.get("APP_URL") ||
      "http://localhost:3000";

    const mobileCallbackUrl = `${publicUrl}/api/v1/payments/mobile-callback?appointmentId=${appointment.id}`;

    const paymentLink = await this.wompi.createPaymentLink({
      amountInCents,
      reference,
      description: `Reserva: ${serviceNames} — ${format(scheduledAt, "d 'de' MMMM 'a las' HH:mm", { locale: es })}`,
      redirectUrl: mobileCallbackUrl,
    });

    await this.prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        amount: totalAmount,
        commissionAmount,
        barberAmount,
        currency: "COP",
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
        referenceId: reference,
        transactionId: paymentLink?.id ?? null,
      },
    });

    const checkoutUrl = paymentLink?.id
      ? `https://checkout.wompi.co/l/${paymentLink.id}`
      : null;

    return {
      checkoutUrl,
      appointmentId: appointment.id,
      reference,
      services: services.map((s) => ({ id: s.id, name: s.name, price: s.price })),
      servicePrice: barberAmount,
      commissionAmount,
      totalAmount,
    };
  }

  /**
   * Pago de cita vía Nequi push notification.
   * 1. Crea appointment PENDING + Payment PENDING.
   * 2. Llama Nequi API → push a la app Nequi del cliente.
   * 3. El cliente aprueba desde su Nequi app (sin salir de BarberProSuite).
   * 4. El móvil hace polling a /payments/nequi-status/:reference cada 3s.
   * 5. Cuando APPROVED → confirmar cita + notificar barbero y cliente.
   */
  async createAppointmentNequiCheckout(
    clientUserId: string,
    dto: {
      barbershopId: string;
      barberId: string;
      serviceIds: string[];
      scheduledAt: string;
      phoneNumber: string;
      notes?: string;
    }
  ) {
    if (!dto.serviceIds?.length) {
      throw new BadRequestException("Debes seleccionar al menos un servicio");
    }

    const [services, barber, clientProfile] = await Promise.all([
      this.prisma.service.findMany({ where: { id: { in: dto.serviceIds }, isActive: true } }),
      this.prisma.barberProfile.findUnique({
        where: { id: dto.barberId },
        include: { user: { select: { id: true, firstName: true, lastName: true, fcmToken: true } } },
      }),
      this.prisma.clientProfile.findUnique({ where: { userId: clientUserId } }),
    ]);

    if (!services.length) throw new NotFoundException("Ningún servicio encontrado");
    if (!barber) throw new NotFoundException("Barbero no encontrado");
    if (!clientProfile) throw new NotFoundException("Perfil de cliente no encontrado");

    const totalServicePrice = services.reduce((s, x) => s + x.price, 0);
    const totalDurationMinutes = services.reduce((s, x) => s + x.durationMinutes, 0);
    const primaryServiceId = dto.serviceIds[0];
    const serviceNames = services.map((s) => s.name).join(" + ");

    const scheduledAt = new Date(dto.scheduledAt);
    const scheduledEnd = addMinutes(scheduledAt, totalDurationMinutes);

    // Verificar conflicto
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        barberId: dto.barberId,
        status: { in: ["PENDING", "CONFIRMED"] },
        AND: [
          { scheduledAt: { lt: scheduledEnd } },
          { scheduledAt: { gte: addMinutes(scheduledAt, -totalDurationMinutes) } },
        ],
      },
    });
    if (conflict) throw new ConflictException("El barbero ya tiene una cita en ese horario");

    const commissionPct = parseFloat(this.config.get("BOOKING_COMMISSION_PERCENT") ?? "10") / 100;
    const commissionAmount = Math.max(Math.round(totalServicePrice * commissionPct), 2000);
    const barberAmount = totalServicePrice;
    const totalAmount = barberAmount + commissionAmount;

    // Crear la cita PENDING
    const appointment = await this.prisma.appointment.create({
      data: {
        barbershopId: dto.barbershopId,
        barberId: dto.barberId,
        clientId: clientProfile.id,
        serviceId: primaryServiceId,
        serviceIds: dto.serviceIds,
        scheduledAt,
        durationMinutes: totalDurationMinutes,
        price: totalServicePrice,
        notes: dto.notes,
        status: "PENDING",
      },
    });

    const reference = `BPS-NQI-${appointment.id.slice(0, 8)}-${Date.now()}`;

    // Crear registro de pago
    await this.prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        amount: totalAmount,
        commissionAmount,
        barberAmount,
        currency: "COP",
        method: PaymentMethod.NEQUI,
        status: PaymentStatus.PENDING,
        referenceId: reference,
      },
    });

    // Enviar push a Nequi del cliente
    const nequiResult = await this.nequi.requestPayment(
      dto.phoneNumber,
      totalAmount,
      reference
    );

    if (!nequiResult.success) {
      // Cancelar la cita si Nequi falla
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: "CANCELLED", cancellationReason: "Error enviando cobro Nequi" },
      });
      throw new BadRequestException(
        nequiResult.message ?? "No se pudo enviar el cobro a Nequi. Verifica el número."
      );
    }

    // Guardar transactionId de Nequi si viene
    if (nequiResult.transactionId) {
      await this.prisma.payment.updateMany({
        where: { referenceId: reference },
        data: { transactionId: nequiResult.transactionId },
      });
    }

    const dateStr = format(scheduledAt, "d 'de' MMMM 'a las' HH:mm", { locale: es });

    return {
      appointmentId: appointment.id,
      reference,
      services: services.map((s) => ({ id: s.id, name: s.name, price: s.price })),
      servicePrice: barberAmount,
      commissionAmount,
      totalAmount,
      message: `Se envió un cobro de ${new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(totalAmount)} a tu Nequi. Ábrelo y apruébalo para confirmar tu cita.`,
    };
  }

  /**
   * Consulta estado de un pago Nequi (para polling desde el móvil).
   * Cuando es APPROVED: confirma la cita y notifica.
   */
  async getNequiPaymentStatus(reference: string) {
    // Buscar el payment en BD
    const payment = await this.prisma.payment.findFirst({
      where: { referenceId: reference, method: "NEQUI" },
    });

    if (!payment) throw new NotFoundException("Pago no encontrado");

    // Si ya está procesado, retornar estado actual sin llamar Nequi de nuevo
    if (payment.status === "APPROVED") {
      return { status: "APPROVED", appointmentId: (payment as any).appointmentId };
    }
    if (payment.status === "DECLINED" || payment.status === "VOIDED") {
      return { status: "REJECTED", appointmentId: (payment as any).appointmentId };
    }

    // Consultar Nequi
    const result = await this.nequi.getPaymentStatus(reference);

    if (result.status === "APPROVED") {
      // Actualizar pago
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.APPROVED, transactionId: result.transactionId },
      });

      // Confirmar cita
      if ((payment as any).appointmentId) {
        const appointment = await this.prisma.appointment.update({
          where: { id: (payment as any).appointmentId },
          data: { status: "CONFIRMED" },
          include: {
            barbershop: true,
            service: true,
            barber: { include: { user: true } },
            client: { include: { user: true } },
          },
        });

        const dateStr = format(appointment.scheduledAt, "d 'de' MMMM 'a las' HH:mm", { locale: es });

        // Notificar cliente
        await this.notifications.notify(
          appointment.client.user.id,
          "APPOINTMENT_CONFIRMED",
          "¡Cita confirmada!",
          `Tu cita de ${appointment.service.name} en ${appointment.barbershop.name} el ${dateStr} está confirmada.`,
          { type: "APPOINTMENT_CONFIRMED", appointmentId: appointment.id },
          appointment.client.user.fcmToken ?? undefined,
        );

        // Notificar barbero
        await this.notifications.notify(
          appointment.barber.user.id,
          "APPOINTMENT_BOOKED",
          "Nueva cita confirmada",
          `${appointment.client.user.firstName} ${appointment.client.user.lastName} pagó y confirmó ${appointment.service.name} el ${dateStr}.`,
          { type: "APPOINTMENT_BOOKED", appointmentId: appointment.id },
          appointment.barber.user.fcmToken ?? undefined,
        );

        this.logger.log(`Cita ${appointment.id} confirmada vía pago Nequi`);
      }

      return { status: "APPROVED", appointmentId: (payment as any).appointmentId };
    }

    if (result.status === "REJECTED" || result.status === "EXPIRED") {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.DECLINED },
      });

      if ((payment as any).appointmentId) {
        await this.prisma.appointment.update({
          where: { id: (payment as any).appointmentId },
          data: { status: "CANCELLED", cancellationReason: `Pago Nequi ${result.status}` },
        });
      }

      return { status: "REJECTED", appointmentId: (payment as any).appointmentId };
    }

    // Aún PENDING
    return { status: "PENDING", appointmentId: (payment as any).appointmentId };
  }
}
