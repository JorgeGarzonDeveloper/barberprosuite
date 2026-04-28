export enum NotificationType {
  // Cola virtual
  QUEUE_JOINED = "queue_joined",
  QUEUE_POSITION_UPDATED = "queue_position_updated",
  QUEUE_CALLED = "queue_called",
  QUEUE_GEOFENCE_WARNING = "queue_geofence_warning",
  QUEUE_GEOFENCE_LOST = "queue_geofence_lost",
  // Citas
  APPOINTMENT_CONFIRMED = "appointment_confirmed",
  APPOINTMENT_REMINDER = "appointment_reminder",
  APPOINTMENT_CANCELLED = "appointment_cancelled",
  APPOINTMENT_COMPLETED = "appointment_completed",
  // Suscripciones
  SUBSCRIPTION_EXPIRING_SOON = "subscription_expiring_soon",
  SUBSCRIPTION_EXPIRED = "subscription_expired",
  SUBSCRIPTION_RENEWED = "subscription_renewed",
  // Pagos
  PAYMENT_RECEIVED = "payment_received",
  PAYMENT_FAILED = "payment_failed",
  // Sistema
  WELCOME = "welcome",
  PROMOTION = "promotion",
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  isRead: boolean;
  sentAt: Date;
  readAt?: Date;
}

export interface PushNotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}
