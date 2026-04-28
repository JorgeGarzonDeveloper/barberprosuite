import { OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
interface PushPayload {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    imageUrl?: string;
}
export declare class NotificationsService implements OnModuleInit {
    private prisma;
    private config;
    private readonly logger;
    private firebaseApp;
    constructor(prisma: PrismaService, config: ConfigService);
    onModuleInit(): void;
    notify(userId: string, type: string, title: string, body: string, data?: Record<string, string>, fcmToken?: string): Promise<void>;
    sendPush(payload: PushPayload): Promise<boolean>;
    sendMulticast(tokens: string[], payload: Omit<PushPayload, "token">): Promise<void>;
    saveNotification(userId: string, type: string, title: string, body: string, data?: Record<string, string>): Promise<{
        id: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        userId: string;
        body: string;
        isRead: boolean;
        sentAt: Date;
        readAt: Date | null;
    }>;
    getUserNotifications(userId: string, page?: number, limit?: number): Promise<{
        notifications: {
            id: string;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            type: import("@prisma/client").$Enums.NotificationType;
            title: string;
            userId: string;
            body: string;
            isRead: boolean;
            sentAt: Date;
            readAt: Date | null;
        }[];
        total: number;
        unreadCount: number;
    }>;
    markAsRead(userId: string, notificationId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    markAllAsRead(userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    private getUnreadCount;
}
export {};
