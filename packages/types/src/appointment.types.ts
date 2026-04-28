export enum AppointmentStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}

export interface Appointment {
  id: string;
  barbershopId: string;
  barberId: string;
  clientId: string;
  serviceId: string;
  status: AppointmentStatus;
  scheduledAt: Date;
  durationMinutes: number;
  price: number;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentDto {
  barbershopId: string;
  barberId: string;
  serviceId: string;
  scheduledAt: string; // ISO date string
  notes?: string;
}

export interface AvailableSlot {
  barberId: string;
  barberName: string;
  date: string;
  slots: TimeSlot[];
}

export interface TimeSlot {
  startTime: string; // "09:00"
  endTime: string;   // "09:30"
  isAvailable: boolean;
}
