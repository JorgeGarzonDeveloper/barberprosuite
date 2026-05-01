export type UserRole = "CLIENT" | "BARBER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
}

export type QueueStatus = "WAITING" | "IN_SERVICE" | "CALLED";

export interface QueueEntry {
  id: string;
  barbershopId: string;
  position: number;
  estimatedWaitMinutes: number;
  status: QueueStatus;
  joinedAt: string;
  calledAt?: string;
  clientName?: string;
  barbershopName?: string;
  barberName?: string;
  barberId?: string;
}

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Appointment {
  id: string;
  scheduledAt: string;
  status: AppointmentStatus;
  serviceNames?: string[];
  totalPrice?: number;
  totalDurationMinutes?: number;
  notes?: string;
  barber: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  barbershop: {
    name: string;
    address: string;
  };
  client?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface Barber {
  id: string;
  userId: string;
  specialties?: string;
  isAvailable: boolean;
  user: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
}

export interface BarberService extends Service {
  barberId: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  client: {
    user: {
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    };
  };
  barber?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface Barbershop {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  latitude: number;
  longitude: number;
  bannerUrl?: string;
  coverImageUrl?: string;
  images?: string[];
  rating: number;
  totalReviews: number;
  distanceMeters?: number;
  barbers: Barber[];
  services?: Service[];
  reviews: Review[];
}

export interface Plan {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  description?: string;
}

export type SubscriptionStatus =
  | "ACTIVE"
  | "PENDING_PAYMENT"
  | "EXPIRED"
  | "CANCELLED";

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  planId: string;
  endDate?: string;
  plan?: Plan;
}

export interface MyQueueResponse {
  barbershopName: string;
  totalWaiting: number;
  inService: number;
  queue: QueueEntry[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

export interface AdminDashboard {
  totalUsers: number;
  totalBarbershops: number;
  totalAppointments: number;
  totalRevenue: number;
  activeSubscriptions: number;
  activeQueues: number;
  appointmentsByStatus?: Record<string, number>;
  revenueByMonth?: { month: string; revenue: number }[];
  newUsersThisMonth?: number;
  completedAppointmentsThisMonth?: number;
}
