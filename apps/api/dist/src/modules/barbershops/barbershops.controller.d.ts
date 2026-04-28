import { BarbershopsService } from "./barbershops.service";
import { CreateBarbershopDto } from "./dto/create-barbershop.dto";
import { UpdateBarbershopDto } from "./dto/update-barbershop.dto";
export declare class BarbershopsController {
    private barbershopsService;
    constructor(barbershopsService: BarbershopsService);
    findAll(page?: number, limit?: number, search?: string): Promise<{
        data: ({
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
        totalPages: number;
    }>;
    findNearby(lat: string, lng: string, radius?: string): Promise<{
        distanceMeters: number;
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
        _count: {
            appointments: number;
            queueEntries: number;
        };
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
    }[]>;
    findOne(id: string): Promise<{
        barbers: ({
            user: {
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
        })[];
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
        reviews: ({
            client: {
                user: {
                    firstName: string;
                    avatarUrl: string;
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
            createdAt: Date;
            rating: number;
            barbershopId: string;
            barberId: string | null;
            clientId: string;
            comment: string | null;
        })[];
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
    }>;
    getQrCode(id: string): Promise<{
        qrImage: string;
        barbershopId: string;
        barbershopName: string;
    }>;
    create(ownerId: string, dto: CreateBarbershopDto): Promise<{
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
    }>;
    update(id: string, ownerId: string, userRole: string, dto: UpdateBarbershopDto): Promise<{
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
    }>;
    regenerateQr(id: string, ownerId: string): Promise<{
        qrImage: string;
        barbershopId: string;
        barbershopName: string;
    }>;
    addReview(id: string, clientId: string, rating: number, comment?: string): Promise<{
        id: string;
        createdAt: Date;
        rating: number;
        barbershopId: string;
        barberId: string | null;
        clientId: string;
        comment: string | null;
    }>;
}
