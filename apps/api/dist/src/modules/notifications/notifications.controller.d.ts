import { NotificationsService } from "./notifications.service";
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(userId: string, page?: number, limit?: number): Promise<{
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
}
