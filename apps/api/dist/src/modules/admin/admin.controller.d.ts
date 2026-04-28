import { AdminService } from "./admin.service";
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getDashboard(): Promise<{
        totalUsers: number;
        totalBarbershops: number;
        totalAppointments: number;
        activeSubscriptions: number;
        newUsersThisMonth: number;
        totalRevenue: number;
    }>;
    getUsers(page?: number, limit?: number, role?: string, search?: string): Promise<{
        data: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
            createdAt: Date;
            barberProfile: {
                barbershop: {
                    name: string;
                };
            };
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getBarbershops(page?: number, limit?: number): Promise<{
        data: ({
            owner: {
                email: string;
                firstName: string;
                lastName: string;
            };
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
                barbers: number;
                appointments: number;
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
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    createBarber(dto: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        password: string;
    }): Promise<{
        id: string;
        email: string;
        phone: string;
        firstName: string;
        lastName: string;
        role: import("@prisma/client").$Enums.UserRole;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
    }>;
    updateUserStatus(userId: string, status: string): Promise<{
        id: string;
        email: string;
        status: import("@prisma/client").$Enums.UserStatus;
    }>;
    getRevenue(): Promise<any[]>;
    getSubscriptions(page?: number, limit?: number): Promise<{
        data: ({
            user: {
                email: string;
                firstName: string;
                lastName: string;
            };
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
            barbershop: {
                name: string;
                city: string;
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
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    assignBarberToBarbershop(userId: string, barbershopId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
