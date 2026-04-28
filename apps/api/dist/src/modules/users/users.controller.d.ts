import { UsersService } from "./users.service";
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        phone: string;
        firstName: string;
        lastName: string;
        role: import("@prisma/client").$Enums.UserRole;
        status: import("@prisma/client").$Enums.UserStatus;
        avatarUrl: string;
        createdAt: Date;
        barberProfile: {
            barbershop: {
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
        };
        clientProfile: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            preferredBarbershopId: string | null;
            loyaltyPoints: number;
            userId: string;
        };
    }>;
    updateProfile(userId: string, body: any): Promise<{
        id: string;
        email: string;
        phone: string;
        firstName: string;
        lastName: string;
        avatarUrl: string;
    }>;
    getBarbers(barbershopId: string): Promise<({
        user: {
            id: string;
            email: string;
            phone: string;
            firstName: string;
            lastName: string;
            avatarUrl: string;
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
    })[]>;
}
