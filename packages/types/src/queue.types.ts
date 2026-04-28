export enum QueueStatus {
  WAITING = "waiting",
  IN_SERVICE = "in_service",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  GEOFENCE_LOST = "geofence_lost",
}

export interface QueueEntry {
  id: string;
  barbershopId: string;
  clientId: string;
  barberId?: string;
  position: number;
  estimatedWaitMinutes: number;
  status: QueueStatus;
  joinedAt: Date;
  calledAt?: Date;
  servedAt?: Date;
  lastLocationLat?: number;
  lastLocationLng?: number;
  lastLocationUpdatedAt?: Date;
  fcmToken?: string;
  // Datos del cliente (join)
  clientName?: string;
  clientPhone?: string;
  clientAvatarUrl?: string;
}

export interface VirtualQueue {
  barbershopId: string;
  barbershopName: string;
  totalWaiting: number;
  estimatedWaitMinutes: number;
  entries: QueueEntry[];
  isOpen: boolean;
}

export interface JoinQueueDto {
  barbershopId: string;
  qrSecret: string;
  latitude: number;
  longitude: number;
  fcmToken?: string;
}

export interface UpdateLocationDto {
  queueEntryId: string;
  latitude: number;
  longitude: number;
}

export enum QueueEvent {
  JOINED = "queue:joined",
  POSITION_UPDATED = "queue:position_updated",
  CALLED = "queue:called",
  GEOFENCE_WARNING = "queue:geofence_warning",
  GEOFENCE_LOST = "queue:geofence_lost",
  CANCELLED = "queue:cancelled",
}
