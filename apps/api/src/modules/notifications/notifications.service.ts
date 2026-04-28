import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";
import { PrismaService } from "../../prisma/prisma.service";

interface PushPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {}

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
    } catch (err) {
      this.logger.error("Failed to initialize Firebase", err);
    }
  }

  /**
   * Envía push Y persiste la notificación en la BD en una sola llamada.
   * Usar este método en lugar de llamar sendPush + saveNotification por separado.
   */
  async notify(
    userId: string,
    type: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    fcmToken?: string
  ): Promise<void> {
    // Persistir siempre, aunque no haya token
    await this.saveNotification(userId, type, title, body, data).catch(() => {});

    if (fcmToken) {
      await this.sendPush({ token: fcmToken, title, body, data });
    }
  }

  async sendPush(payload: PushPayload): Promise<boolean> {
    if (!this.firebaseApp || !payload.token) {
      this.logger.debug("Push skipped (no firebase or no token)");
      return false;
    }

    try {
      const message: admin.messaging.Message = {
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
    } catch (err) {
      this.logger.error(`Push notification failed: ${err.message}`);
      return false;
    }
  }

  async sendMulticast(tokens: string[], payload: Omit<PushPayload, "token">) {
    if (!this.firebaseApp || tokens.length === 0) return;

    const message: admin.messaging.MulticastMessage = {
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
      this.logger.log(
        `Multicast: ${response.successCount} success, ${response.failureCount} failed`
      );
    } catch (err) {
      this.logger.error("Multicast failed", err);
    }
  }

  async saveNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        body,
        data: data as any,
      },
    });
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
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

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  private async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
