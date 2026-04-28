"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const wompi_service_1 = require("./wompi.service");
const nequi_service_1 = require("./nequi.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const date_fns_2 = require("date-fns");
const locale_1 = require("date-fns/locale");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(prisma, wompi, nequi, notifications, config) {
        this.prisma = prisma;
        this.wompi = wompi;
        this.nequi = nequi;
        this.notifications = notifications;
        this.config = config;
        this.logger = new common_1.Logger(PaymentsService_1.name);
    }
    async getPseBanks() {
        return this.wompi.getPseBanks();
    }
    async createSubscriptionPayment(subscriptionId, method, params) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: {
                plan: true,
                barbershop: { include: { owner: true } },
            },
        });
        if (!subscription)
            throw new common_1.NotFoundException("Suscripción no encontrada");
        const amount = subscription.plan.priceMonthly;
        const amountInCents = Math.round(amount * 100);
        const reference = `BPS-SUB-${subscription.id}-${Date.now()}`;
        const payment = await this.prisma.payment.create({
            data: {
                subscriptionId,
                amount,
                currency: "COP",
                method,
                status: client_1.PaymentStatus.PENDING,
                referenceId: reference,
            },
        });
        let result;
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
                        metadata: result,
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
                        notes: "Envía el comprobante a pagos@barberprosuite.com con el número de referencia",
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
                throw new common_1.BadRequestException("Método de pago no soportado");
        }
    }
    async handleWebhook(body, signature) {
        const event = body.event;
        const transaction = body.data?.transaction;
        this.logger.log(`Webhook recibido: event=${event}, status=${transaction?.status}`);
        this.logger.log(`Transaction completa: ${JSON.stringify(transaction)}`);
        if (!transaction) {
            this.logger.warn("Webhook sin transaction data");
            return;
        }
        const isValid = this.wompi.validateWebhookSignature(transaction.id, transaction.amount_in_cents, transaction.currency, transaction.status, body.timestamp, signature);
        if (!isValid) {
            this.logger.warn(`Firma inválida (sandbox) — procesando de todas formas. signature=${signature}`);
        }
        if (event === "transaction.updated") {
            const paymentInclude = {
                subscription: { include: { barbershop: { include: { owner: true } } } },
            };
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
            if (!payment && transaction.payment_link_id) {
                payment = await this.prisma.payment.findFirst({
                    where: { transactionId: transaction.payment_link_id },
                    include: paymentInclude,
                });
            }
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
                    data: { status: client_1.PaymentStatus.APPROVED },
                });
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
                    if (owner?.fcmToken) {
                        await this.notifications.notify(owner.id, "PAYMENT_RECEIVED", "Pago recibido", "Tu suscripción ha sido activada exitosamente.", { type: "PAYMENT_RECEIVED", paymentId: payment.id }, owner.fcmToken);
                    }
                }
                if (payment.appointmentId) {
                    const appointment = await this.prisma.appointment.update({
                        where: { id: payment.appointmentId },
                        data: { status: "CONFIRMED" },
                        include: {
                            barbershop: true,
                            service: true,
                            barber: { include: { user: true } },
                            client: { include: { user: true } },
                        },
                    });
                    const dateStr = (0, date_fns_2.format)(appointment.scheduledAt, "d 'de' MMMM 'a las' HH:mm", { locale: locale_1.es });
                    await this.notifications.notify(appointment.client.user.id, "APPOINTMENT_CONFIRMED", "¡Cita confirmada!", `Tu cita de ${appointment.service.name} en ${appointment.barbershop.name} el ${dateStr} está confirmada.`, { type: "APPOINTMENT_CONFIRMED", appointmentId: appointment.id }, appointment.client.user.fcmToken ?? undefined);
                    await this.notifications.notify(appointment.barber.user.id, "APPOINTMENT_BOOKED", "Nueva cita agendada", `${appointment.client.user.firstName} ${appointment.client.user.lastName} agendó ${appointment.service.name} el ${dateStr}.`, { type: "APPOINTMENT_BOOKED", appointmentId: appointment.id }, appointment.barber.user.fcmToken ?? undefined);
                    this.logger.log(`Cita ${appointment.id} confirmada tras pago aprobado`);
                }
            }
            else if (transaction.status === "DECLINED" ||
                transaction.status === "VOIDED") {
                const failStatus = transaction.status === "DECLINED"
                    ? client_1.PaymentStatus.DECLINED
                    : client_1.PaymentStatus.VOIDED;
                await this.prisma.payment.update({
                    where: { id: payment.id },
                    data: { status: failStatus },
                });
                if (payment.appointmentId) {
                    await this.prisma.appointment.update({
                        where: { id: payment.appointmentId },
                        data: { status: "CANCELLED", cancellationReason: "Pago rechazado" },
                    });
                }
                const sub = payment.subscription;
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
    async getPaymentHistory(barbershopId, page = 1, limit = 20) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { barbershopId },
        });
        if (!subscription)
            return { data: [], total: 0 };
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
    async createBarberCheckoutLink(subscriptionId, email, planName, customRedirectUrl) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: { plan: true },
        });
        if (!subscription)
            throw new common_1.NotFoundException("Suscripción no encontrada");
        const reference = `BPS-${subscriptionId.slice(0, 8)}-${Date.now()}`;
        const amountInCents = Math.round(subscription.plan.priceMonthly * 100);
        const publicUrl = this.config.get("NGROK_URL") ||
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
                method: client_1.PaymentMethod.BANK_TRANSFER,
                status: client_1.PaymentStatus.PENDING,
                referenceId: reference,
                transactionId: paymentLink?.id ?? null,
            },
        });
        const checkoutUrl = paymentLink?.id
            ? `https://checkout.wompi.co/l/${paymentLink.id}`
            : null;
        return { checkoutUrl, reference };
    }
    async createAppointmentCheckoutLink(clientUserId, dto) {
        if (!dto.serviceIds?.length) {
            throw new common_1.BadRequestException("Debes seleccionar al menos un servicio");
        }
        const [services, barber, clientProfile] = await Promise.all([
            this.prisma.service.findMany({ where: { id: { in: dto.serviceIds }, isActive: true } }),
            this.prisma.barberProfile.findUnique({
                where: { id: dto.barberId },
                include: { user: { select: { id: true, firstName: true, lastName: true, fcmToken: true } } },
            }),
            this.prisma.clientProfile.findUnique({ where: { userId: clientUserId } }),
        ]);
        if (!services.length)
            throw new common_1.NotFoundException("Ningún servicio encontrado");
        if (!barber)
            throw new common_1.NotFoundException("Barbero no encontrado");
        if (!clientProfile)
            throw new common_1.NotFoundException("Perfil de cliente no encontrado");
        const totalServicePrice = services.reduce((sum, s) => sum + s.price, 0);
        const totalDurationMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
        const serviceNames = services.map((s) => s.name).join(" + ");
        const primaryServiceId = dto.serviceIds[0];
        const scheduledAt = new Date(dto.scheduledAt);
        const scheduledEnd = (0, date_fns_1.addMinutes)(scheduledAt, totalDurationMinutes);
        const conflict = await this.prisma.appointment.findFirst({
            where: {
                barberId: dto.barberId,
                status: { in: ["PENDING", "CONFIRMED"] },
                AND: [
                    { scheduledAt: { lt: scheduledEnd } },
                    { scheduledAt: { gte: (0, date_fns_1.addMinutes)(scheduledAt, -totalDurationMinutes) } },
                ],
            },
        });
        if (conflict) {
            throw new common_1.ConflictException("El barbero ya tiene una cita en ese horario");
        }
        const commissionPct = parseFloat(this.config.get("BOOKING_COMMISSION_PERCENT") ?? "10") / 100;
        const commissionAmount = Math.max(Math.round(totalServicePrice * commissionPct), 2000);
        const barberAmount = totalServicePrice;
        const totalAmount = barberAmount + commissionAmount;
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
        const publicUrl = this.config.get("NGROK_URL") ||
            this.config.get("APP_URL") ||
            "http://localhost:3000";
        const mobileCallbackUrl = `${publicUrl}/api/v1/payments/mobile-callback?appointmentId=${appointment.id}`;
        const paymentLink = await this.wompi.createPaymentLink({
            amountInCents,
            reference,
            description: `Reserva: ${serviceNames} — ${(0, date_fns_2.format)(scheduledAt, "d 'de' MMMM 'a las' HH:mm", { locale: locale_1.es })}`,
            redirectUrl: mobileCallbackUrl,
        });
        await this.prisma.payment.create({
            data: {
                appointmentId: appointment.id,
                amount: totalAmount,
                commissionAmount,
                barberAmount,
                currency: "COP",
                method: client_1.PaymentMethod.BANK_TRANSFER,
                status: client_1.PaymentStatus.PENDING,
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
    async createAppointmentNequiCheckout(clientUserId, dto) {
        if (!dto.serviceIds?.length) {
            throw new common_1.BadRequestException("Debes seleccionar al menos un servicio");
        }
        const [services, barber, clientProfile] = await Promise.all([
            this.prisma.service.findMany({ where: { id: { in: dto.serviceIds }, isActive: true } }),
            this.prisma.barberProfile.findUnique({
                where: { id: dto.barberId },
                include: { user: { select: { id: true, firstName: true, lastName: true, fcmToken: true } } },
            }),
            this.prisma.clientProfile.findUnique({ where: { userId: clientUserId } }),
        ]);
        if (!services.length)
            throw new common_1.NotFoundException("Ningún servicio encontrado");
        if (!barber)
            throw new common_1.NotFoundException("Barbero no encontrado");
        if (!clientProfile)
            throw new common_1.NotFoundException("Perfil de cliente no encontrado");
        const totalServicePrice = services.reduce((s, x) => s + x.price, 0);
        const totalDurationMinutes = services.reduce((s, x) => s + x.durationMinutes, 0);
        const primaryServiceId = dto.serviceIds[0];
        const serviceNames = services.map((s) => s.name).join(" + ");
        const scheduledAt = new Date(dto.scheduledAt);
        const scheduledEnd = (0, date_fns_1.addMinutes)(scheduledAt, totalDurationMinutes);
        const conflict = await this.prisma.appointment.findFirst({
            where: {
                barberId: dto.barberId,
                status: { in: ["PENDING", "CONFIRMED"] },
                AND: [
                    { scheduledAt: { lt: scheduledEnd } },
                    { scheduledAt: { gte: (0, date_fns_1.addMinutes)(scheduledAt, -totalDurationMinutes) } },
                ],
            },
        });
        if (conflict)
            throw new common_1.ConflictException("El barbero ya tiene una cita en ese horario");
        const commissionPct = parseFloat(this.config.get("BOOKING_COMMISSION_PERCENT") ?? "10") / 100;
        const commissionAmount = Math.max(Math.round(totalServicePrice * commissionPct), 2000);
        const barberAmount = totalServicePrice;
        const totalAmount = barberAmount + commissionAmount;
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
        await this.prisma.payment.create({
            data: {
                appointmentId: appointment.id,
                amount: totalAmount,
                commissionAmount,
                barberAmount,
                currency: "COP",
                method: client_1.PaymentMethod.NEQUI,
                status: client_1.PaymentStatus.PENDING,
                referenceId: reference,
            },
        });
        const nequiResult = await this.nequi.requestPayment(dto.phoneNumber, totalAmount, reference);
        if (!nequiResult.success) {
            await this.prisma.appointment.update({
                where: { id: appointment.id },
                data: { status: "CANCELLED", cancellationReason: "Error enviando cobro Nequi" },
            });
            throw new common_1.BadRequestException(nequiResult.message ?? "No se pudo enviar el cobro a Nequi. Verifica el número.");
        }
        if (nequiResult.transactionId) {
            await this.prisma.payment.updateMany({
                where: { referenceId: reference },
                data: { transactionId: nequiResult.transactionId },
            });
        }
        const dateStr = (0, date_fns_2.format)(scheduledAt, "d 'de' MMMM 'a las' HH:mm", { locale: locale_1.es });
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
    async getNequiPaymentStatus(reference) {
        const payment = await this.prisma.payment.findFirst({
            where: { referenceId: reference, method: "NEQUI" },
        });
        if (!payment)
            throw new common_1.NotFoundException("Pago no encontrado");
        if (payment.status === "APPROVED") {
            return { status: "APPROVED", appointmentId: payment.appointmentId };
        }
        if (payment.status === "DECLINED" || payment.status === "VOIDED") {
            return { status: "REJECTED", appointmentId: payment.appointmentId };
        }
        const result = await this.nequi.getPaymentStatus(reference);
        if (result.status === "APPROVED") {
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: { status: client_1.PaymentStatus.APPROVED, transactionId: result.transactionId },
            });
            if (payment.appointmentId) {
                const appointment = await this.prisma.appointment.update({
                    where: { id: payment.appointmentId },
                    data: { status: "CONFIRMED" },
                    include: {
                        barbershop: true,
                        service: true,
                        barber: { include: { user: true } },
                        client: { include: { user: true } },
                    },
                });
                const dateStr = (0, date_fns_2.format)(appointment.scheduledAt, "d 'de' MMMM 'a las' HH:mm", { locale: locale_1.es });
                await this.notifications.notify(appointment.client.user.id, "APPOINTMENT_CONFIRMED", "¡Cita confirmada!", `Tu cita de ${appointment.service.name} en ${appointment.barbershop.name} el ${dateStr} está confirmada.`, { type: "APPOINTMENT_CONFIRMED", appointmentId: appointment.id }, appointment.client.user.fcmToken ?? undefined);
                await this.notifications.notify(appointment.barber.user.id, "APPOINTMENT_BOOKED", "Nueva cita confirmada", `${appointment.client.user.firstName} ${appointment.client.user.lastName} pagó y confirmó ${appointment.service.name} el ${dateStr}.`, { type: "APPOINTMENT_BOOKED", appointmentId: appointment.id }, appointment.barber.user.fcmToken ?? undefined);
                this.logger.log(`Cita ${appointment.id} confirmada vía pago Nequi`);
            }
            return { status: "APPROVED", appointmentId: payment.appointmentId };
        }
        if (result.status === "REJECTED" || result.status === "EXPIRED") {
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: { status: client_1.PaymentStatus.DECLINED },
            });
            if (payment.appointmentId) {
                await this.prisma.appointment.update({
                    where: { id: payment.appointmentId },
                    data: { status: "CANCELLED", cancellationReason: `Pago Nequi ${result.status}` },
                });
            }
            return { status: "REJECTED", appointmentId: payment.appointmentId };
        }
        return { status: "PENDING", appointmentId: payment.appointmentId };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wompi_service_1.WompiService,
        nequi_service_1.NequiService,
        notifications_service_1.NotificationsService,
        config_1.ConfigService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map