export enum UserRole {
  ADMIN = "admin",
  BARBER = "barber",
  CLIENT = "client",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING_VERIFICATION = "pending_verification",
}

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BarberProfile {
  id: string;
  userId: string;
  user: User;
  barbershopId: string;
  specialties: string[];
  bio?: string;
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  workingHours: WorkingHours[];
  subscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkingHours {
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  openTime: string;  // "09:00"
  closeTime: string; // "18:00"
  isOpen: boolean;
}

export interface ClientProfile {
  id: string;
  userId: string;
  user: User;
  preferredBarbershopId?: string;
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}
