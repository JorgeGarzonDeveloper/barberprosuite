import { PrismaService } from "../../prisma/prisma.service";
export declare class BarberService {
    private prisma;
    constructor(prisma: PrismaService);
    getMyProfile(userId: string): Promise<{
        user: {
            id: string;
            email: string;
            phone: string;
            firstName: string;
            lastName: string;
            status: import("@prisma/client").$Enums.UserStatus;
            avatarUrl: string;
        };
        barbershop: {
            services: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                barbershopId: string;
                barberId: string | null;
                durationMinutes: number;
                price: number;
            }[];
            subscription: {
                plan: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    displayName: string;
                    description: string;
                    priceMonthly: number;
                    priceYearly: number;
                    maxBarbers: number;
                    maxAppointmentsPerMonth: number;
                    features: string[];
                    isActive: boolean;
                };
            } & {
                id: string;
                status: import("@prisma/client").$Enums.SubscriptionStatus;
                createdAt: Date;
                updatedAt: Date;
                userId: string | null;
                barbershopId: string | null;
                startDate: Date;
                planId: string;
                endDate: Date;
                renewalDate: Date;
                autoRenew: boolean;
            };
            _count: {
                appointments: number;
                queueEntries: number;
            };
        } & {
            id: string;
            email: string | null;
            phone: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
            slug: string;
            qrSecret: string;
            address: string;
            city: string;
            state: string;
            country: string;
            latitude: number;
            longitude: number;
            logoUrl: string | null;
            coverImageUrl: string | null;
            images: string[];
            rating: number;
            totalReviews: number;
            ownerId: string;
            workingHours: import("@prisma/client/runtime/library").JsonValue;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        rating: number;
        totalReviews: number;
        workingHours: import("@prisma/client/runtime/library").JsonValue;
        userId: string;
        specialties: string[];
        bio: string | null;
        isAvailable: boolean;
        barbershopId: string | null;
    }>;
    private verifyBarberBelongsToBarbershop;
    getMyServices(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        barbershopId: string;
        barberId: string | null;
        durationMinutes: number;
        price: number;
    }[]>;
    getServicesByBarber(barberId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        barbershopId: string;
        barberId: string | null;
        durationMinutes: number;
        price: number;
    }[]>;
    createService(userId: string, dto: {
        name: string;
        description?: string;
        durationMinutes: number;
        price: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        barbershopId: string;
        barberId: string | null;
        durationMinutes: number;
        price: number;
    }>;
    updateService(userId: string, serviceId: string, dto: {
        name?: string;
        description?: string;
        durationMinutes?: number;
        price?: number;
        isActive?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        barbershopId: string;
        barberId: string | null;
        durationMinutes: number;
        price: number;
    }>;
    deleteService(userId: string, serviceId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        barbershopId: string;
        barberId: string | null;
        durationMinutes: number;
        price: number;
    }>;
    getMyStats(userId: string): Promise<{
        todayAppointments: number;
        monthAppointments: number;
        services: number;
    }>;
    getMyAppointments(userId: string, page?: number, limit?: number): Promise<{
        data: any[];
        total: number;
        page?: undefined;
        limit?: undefined;
    } | {
        data: ({
            service: {
                name: string;
                durationMinutes: number;
                price: number;
            };
            client: {
                user: {
                    phone: string;
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                preferredBarbershopId: string | null;
                loyaltyPoints: number;
                userId: string;
            };
        } & {
            id: string;
            status: import("@prisma/client").$Enums.AppointmentStatus;
            createdAt: Date;
            updatedAt: Date;
            barbershopId: string;
            barberId: string;
            durationMinutes: number;
            price: number;
            clientId: string;
            serviceId: string;
            scheduledAt: Date;
            notes: string | null;
            serviceIds: string[];
            cancellationReason: string | null;
            cancelledAt: Date | null;
            completedAt: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
}
