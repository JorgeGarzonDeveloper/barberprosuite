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
var SubscriptionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let SubscriptionsService = SubscriptionsService_1 = class SubscriptionsService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.logger = new common_1.Logger(SubscriptionsService_1.name);
    }
    async getPlans() {
        return this.prisma.plan.findMany({
            where: { isActive: true },
            orderBy: { priceMonthly: "asc" },
        });
    }
    async getSubscription(barbershopId) {
        return this.prisma.subscription.findUnique({
            where: { barbershopId },
            include: { plan: true },
        });
    }
    async subscribe(barbershopId, planId) {
        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new common_1.NotFoundException("Plan no encontrado");
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
    async subscribeUser(userId, planId) {
        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new common_1.NotFoundException("Plan no encontrado");
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
    async getUserSubscription(userId) {
        return this.prisma.subscription.findFirst({
            where: { userId },
            include: { plan: true },
        });
    }
    async activateSubscription(subscriptionId) {
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
                if (!sub.barbershop)
                    continue;
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
                await this.notifications.saveNotification(sub.barbershop.ownerId, "SUBSCRIPTION_EXPIRING_SOON", `Tu suscripción vence en ${days} ${days === 1 ? "día" : "días"}`, `Renueva tu plan ${sub.plan.displayName} para evitar interrupciones`);
            }
            this.logger.log(`Found ${expiring.length} subs expiring in ${days} days`);
        }
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
};
exports.SubscriptionsService = SubscriptionsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_8AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionsService.prototype, "checkExpiringSubscriptions", null);
exports.SubscriptionsService = SubscriptionsService = SubscriptionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map