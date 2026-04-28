import { QueueService } from "./queue.service";
import { JoinQueueDto } from "./dto/join-queue.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";
export declare class QueueController {
    private queueService;
    constructor(queueService: QueueService);
    getMyEntry(userId: string): Promise<{
        barbershopName: string;
        id: any;
        barbershopId: any;
        clientId: any;
        barberId: any;
        position: any;
        estimatedWaitMinutes: any;
        status: any;
        joinedAt: any;
        calledAt: any;
        servedAt: any;
        clientName: string;
        clientAvatarUrl: any;
        barberName: string;
    }>;
    getAvailableBarbers(barbershopId: string): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl: string;
        specialties: string[];
        rating: number;
        queueLength: number;
        estimatedWaitMinutes: number;
    }[]>;
    getBarberQueue(userId: string): Promise<{
        barbershopName: string;
        totalWaiting: number;
        inService: {
            client: {
                user: {
                    firstName: string;
                    lastName: string;
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
            status: import("@prisma/client").$Enums.QueueStatus;
            updatedAt: Date;
            barbershopId: string;
            barberId: string | null;
            clientId: string;
            position: number;
            estimatedWaitMinutes: number;
            joinedAt: Date;
            calledAt: Date | null;
            servedAt: Date | null;
            lastLocationLat: number | null;
            lastLocationLng: number | null;
            lastLocationUpdatedAt: Date | null;
            geofenceWarningsSent: number;
        };
        queue: {
            id: any;
            barbershopId: any;
            clientId: any;
            barberId: any;
            position: any;
            estimatedWaitMinutes: any;
            status: any;
            joinedAt: any;
            calledAt: any;
            servedAt: any;
            clientName: string;
            clientAvatarUrl: any;
            barberName: string;
        }[];
    }>;
    callNextMine(userId: string): Promise<{
        id: any;
        barbershopId: any;
        clientId: any;
        barberId: any;
        position: any;
        estimatedWaitMinutes: any;
        status: any;
        joinedAt: any;
        calledAt: any;
        servedAt: any;
        clientName: string;
        clientAvatarUrl: any;
        barberName: string;
    }>;
    completeCurrent(userId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        updatedAt: Date;
        barbershopId: string;
        barberId: string | null;
        clientId: string;
        position: number;
        estimatedWaitMinutes: number;
        joinedAt: Date;
        calledAt: Date | null;
        servedAt: Date | null;
        lastLocationLat: number | null;
        lastLocationLng: number | null;
        lastLocationUpdatedAt: Date | null;
        geofenceWarningsSent: number;
    }>;
    getQueue(barbershopId: string): Promise<{
        barbershopId: string;
        barbershopName: string;
        totalWaiting: number;
        estimatedWaitMinutes: number;
        entries: {
            id: any;
            barbershopId: any;
            clientId: any;
            barberId: any;
            position: any;
            estimatedWaitMinutes: any;
            status: any;
            joinedAt: any;
            calledAt: any;
            servedAt: any;
            clientName: string;
            clientAvatarUrl: any;
            barberName: string;
        }[];
        isOpen: boolean;
    }>;
    joinQueue(clientId: string, dto: JoinQueueDto): Promise<{
        id: any;
        barbershopId: any;
        clientId: any;
        barberId: any;
        position: any;
        estimatedWaitMinutes: any;
        status: any;
        joinedAt: any;
        calledAt: any;
        servedAt: any;
        clientName: string;
        clientAvatarUrl: any;
        barberName: string;
    }>;
    updateLocation(clientId: string, dto: UpdateLocationDto): Promise<{
        entryId: string;
        distanceMeters: number;
        isInGeofence: boolean;
        warningThreshold: number;
    }>;
    callNext(barbershopId: string, barberId: string): Promise<{
        id: any;
        barbershopId: any;
        clientId: any;
        barberId: any;
        position: any;
        estimatedWaitMinutes: any;
        status: any;
        joinedAt: any;
        calledAt: any;
        servedAt: any;
        clientName: string;
        clientAvatarUrl: any;
        barberName: string;
    }>;
    completeService(entryId: string, barberId: string, barbershopId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.QueueStatus;
        updatedAt: Date;
        barbershopId: string;
        barberId: string | null;
        clientId: string;
        position: number;
        estimatedWaitMinutes: number;
        joinedAt: Date;
        calledAt: Date | null;
        servedAt: Date | null;
        lastLocationLat: number | null;
        lastLocationLng: number | null;
        lastLocationUpdatedAt: Date | null;
        geofenceWarningsSent: number;
    }>;
    leaveQueue(clientId: string, entryId: string): Promise<void>;
}
