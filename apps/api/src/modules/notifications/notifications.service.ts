import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";
import * as webPush from "web-push";
import { PrismaService } from "../../prisma/prisma.service";

interface PushPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

interface WebPushSubscriptionDto {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App | null = null;
  private vapidConfigured = false;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {}

  onModuleInit() {
    // ── Firebase (mobile) ──────────────────────────────────────────────────
    const projectId = this.config.get("FIREBASE_PROJECT_ID");
    if (!projectId) {
      this.logger.warn("Firebase not configured — mobile push disabled");
    } else {
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

    // ── VAPID (web push) ───────────────────────────────────────────────────
    const vapidPublic = this.config.get<string>("VAPID_PUBLIC_KEY");
    const vapidPrivate = this.config.get<string>("VAPID_PRIVATE_KEY");
    const vapidEmail = this.config.get<string>("VAPID_EMAIL");

    if (vapidPublic && vapidPrivate && vapidEmail &&
        vapidPublic !== "undefined" && vapidPrivate !== "undefined") {
      try {
        webPush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);
        this.vapidConfigured = true;
        this.logger.log("Web Push (VAPID) initialized");
      } catch (err) {
        this.logger.error(`VAPID initialization failed: ${err.message} — web push disabled`);
      }
    } else {
      this.logger.warn("VAPID keys not configured — web push disabled");
    }
  }

  // ── VAPID public key ─────────────────────────────────────────────────────
  getVapidPublicKey(): string | null {
    return this.config.get<string>("VAPID_PUBLIC_KEY") ?? null;
  }

  // ── Web Push subscriptions ───────────────────────────────────────────────
  async saveWebPushSubscription(
    userId: string,
    sub: WebPushSubscriptionDto,
    userAgent?: string
  ) {
    return this.prisma.webPushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: {
        userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userAgent: userAgent ?? null,
      },
      update: {
        userId,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userAgent: userAgent ?? null,
      },
    });
  }

  async removeWebPushSubscription(endpoint: string) {
    await this.prisma.webPushSubscription
      .delete({ where: { endpoint } })
      .catch(() => {}); // Silenciar si no existe
  }

  // ── Send web push to a single user ──────────────────────────────────────
  async sendWebPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    if (!this.vapidConfigured) return;

    const subscriptions = await this.prisma.webPushSubscription.findMany({
      where: { userId },
    });

    const payload = JSON.stringify({ title, body, data: data ?? {} });

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
        } catch (err: any) {
          // 410 Gone = suscripción expirada, eliminar
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await this.prisma.webPushSubscription
              .delete({ where: { id: sub.id } })
              .catch(() => {});
          }
          this.logger.warn(`Web push failed for ${sub.endpoint}: ${err?.message}`);
        }
      })
    );
  }

  // ── Send web push to all users with a given role ─────────────────────────
  async sendWebPushByRole(
    roles: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    if (!this.vapidConfigured) return;

    const users = await this.prisma.user.findMany({
      where: { role: { in: roles as any[] } },
      select: { id: true },
    });

    await Promise.allSettled(
      users.map((u) => this.sendWebPush(u.id, title, body, data))
    );
  }

  /**
   * Envía push (FCM + Web) Y persiste la notificación en BD.
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
    await this.saveNotification(userId, type, title, body, data).catch(() => {});

    // Mobile (Firebase)
    if (fcmToken) {
      await this.sendPush({ token: fcmToken, title, body, data });
    }

    // Web (VAPID)
    await this.sendWebPush(userId, title, body, data);
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
