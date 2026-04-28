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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const admin = require("firebase-admin");
const prisma_service_1 = require("../../prisma/prisma.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.logger = new common_1.Logger(NotificationsService_1.name);
        this.firebaseApp = null;
    }
    onModuleInit() {
        const projectId = this.config.get("FIREBASE_PROJECT_ID");
        if (!projectId) {
            this.logger.warn("Firebase not configured — push notifications disabled");
            return;
        }
        try {
            this.firebaseApp = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    privateKey: this.config
                        .get("FIREBASE_PRIVATE_KEY")
                        ?.replace(/\\n/g, "\n"),
                    clientEmail: this.config.get("FIREBASE_CLIENT_EMAIL"),
                }),
            });
            this.logger.log("Firebase Admin SDK initialized");
        }
        catch (err) {
            this.logger.error("Failed to initialize Firebase", err);
        }
    }
    async notify(userId, type, title, body, data, fcmToken) {
        await this.saveNotification(userId, type, title, body, data).catch(() => { });
        if (fcmToken) {
            await this.sendPush({ token: fcmToken, title, body, data });
        }
    }
    async sendPush(payload) {
        if (!this.firebaseApp || !payload.token) {
            this.logger.debug("Push skipped (no firebase or no token)");
            return false;
        }
        try {
            const message = {
                token: payload.token,
                notification: {
                    title: payload.title,
                    body: payload.body,
                    imageUrl: payload.imageUrl,
                },
                data: payload.data,
                android: {
                    priority: "high",
                    notification: {
                        channelId: "barberprosuite",
                        priority: "high",
                        sound: "default",
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            alert: { title: payload.title, body: payload.body },
                            sound: "default",
                            badge: 1,
                        },
                    },
                },
            };
            await admin.messaging(this.firebaseApp).send(message);
            return true;
        }
        catch (err) {
            this.logger.error(`Push notification failed: ${err.message}`);
            return false;
        }
    }
    async sendMulticast(tokens, payload) {
        if (!this.firebaseApp || tokens.length === 0)
            return;
        const message = {
            tokens,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data,
        };
        try {
            const response = await admin
                .messaging(this.firebaseApp)
                .sendEachForMulticast(message);
            this.logger.log(`Multicast: ${response.successCount} success, ${response.failureCount} failed`);
        }
        catch (err) {
            this.logger.error("Multicast failed", err);
        }
    }
    async saveNotification(userId, type, title, body, data) {
        return this.prisma.notification.create({
            data: {
                userId,
                type: type,
                title,
                body,
                data: data,
            },
        });
    }
    async getUserNotifications(userId, page = 1, limit = 20) {
        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId },
                orderBy: { sentAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.notification.count({ where: { userId } }),
        ]);
        return { notifications, total, unreadCount: await this.getUnreadCount(userId) };
    }
    async markAsRead(userId, notificationId) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async markAllAsRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async getUnreadCount(userId) {
        return this.prisma.notification.count({
            where: { userId, isRead: false },
        });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map