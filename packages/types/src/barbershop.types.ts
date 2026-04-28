export interface Barbershop {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  phone: string;
  email?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  images: string[];
  rating: number;
  totalReviews: number;
  isActive: boolean;
  ownerId: string;
  services: Service[];
  workingHours: BarbershopWorkingHours[];
  qrCode: string;       // URL del QR único de la barbería
  qrSecret: string;     // Secret para validar el QR
  distanceMeters?: number; // Calculado dinámicamente
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  barbershopId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
}

export interface BarbershopWorkingHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface Review {
  id: string;
  barbershopId: string;
  barberId?: string;
  clientId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface NearbyBarbershopQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  limit?: number;
}
