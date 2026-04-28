import { PrismaService } from "../../prisma/prisma.service";
import { GeoService } from "../geo/geo.service";
import { CreateBarbershopDto } from "./dto/create-barbershop.dto";
import { UpdateBarbershopDto } from "./dto/update-barbershop.dto";
export declare class BarbershopsService {
    private prisma;
    private geo;
    constructor(prisma: PrismaService, geo: GeoService);
    findNearby(latitude: number, longitude: number, radiusKm?: number, limit?: number): Promise<{
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
    update(id: string, ownerId: string, dto: UpdateBarbershopDto, userRole?: string): Promise<{
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
    getQrCode(barbershopId: string): Promise<{
        qrImage: string;
        barbershopId: string;
        barbershopName: string;
    }>;
    regenerateQr(barbershopId: string, ownerId: string, userRole?: string): Promise<{
        qrImage: string;
        barbershopId: string;
        barbershopName: string;
    }>;
    addService(barbershopId: string, ownerId: string, serviceData: any): Promise<{
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
    addReview(barbershopId: string, clientId: string, rating: number, comment?: string): Promise<{
        id: string;
        createdAt: Date;
        rating: number;
        barbershopId: string;
        barberId: string | null;
        clientId: string;
        comment: string | null;
    }>;
    private validateOwnership;
    private generateSlug;
}
