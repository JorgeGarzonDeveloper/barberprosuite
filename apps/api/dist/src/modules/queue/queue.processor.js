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
var QueueProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const geo_service_1 = require("../geo/geo.service");
let QueueProcessor = QueueProcessor_1 = class QueueProcessor {
    constructor(prisma, notifications, geo) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.geo = geo;
        this.logger = new common_1.Logger(QueueProcessor_1.name);
    }
    async checkGeofence(job) {
        const { entryId, barbershopId } = job.data;
        const entry = await this.prisma.queueEntry.findUnique({
            where: { id: entryId },
            include: {
                barbershop: true,
                client: { include: { user: true } },
            },
        });
        if (!entry || entry.status !== "WAITING") {
            return { skip: true };
        }
        const locationAge = entry.lastLocationUpdatedAt
            ? (Date.now() - entry.lastLocationUpdatedAt.getTime()) / 1000
            : Infinity;
        if (locationAge > 300) {
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
            this.logger.warn(`Entry ${entryId}: No location update for ${Math.round(locationAge)}s`);
        }
        return { checked: true, locationAge };
    }
    async sendAppointmentReminder(job) {
        const { appointmentId, minutesBefore } = job.data;
        const appointment = await this.prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                client: { include: { user: true } },
                barbershop: true,
                service: true,
            },
        });
        if (!appointment || appointment.status !== "CONFIRMED")
            return;
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
        this.logger.log(`Appointment reminder sent for ${appointmentId} (${minutesBefore}min before)`);
    }
    async checkSubscriptionExpiry(job) {
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
        if (!sub || sub.status !== "ACTIVE")
            return;
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
        this.logger.log(`Subscription expiry warning sent: ${subscriptionId} (${daysUntilExpiry} days)`);
    }
};
exports.QueueProcessor = QueueProcessor;
__decorate([
    (0, bull_1.Process)("check-geofence"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QueueProcessor.prototype, "checkGeofence", null);
__decorate([
    (0, bull_1.Process)("send-appointment-reminder"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QueueProcessor.prototype, "sendAppointmentReminder", null);
__decorate([
    (0, bull_1.Process)("check-subscription-expiry"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QueueProcessor.prototype, "checkSubscriptionExpiry", null);
exports.QueueProcessor = QueueProcessor = QueueProcessor_1 = __decorate([
    (0, bull_1.Processor)("virtual-queue"),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        geo_service_1.GeoService])
], QueueProcessor);
//# sourceMappingURL=queue.processor.js.map