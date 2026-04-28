import { OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { QueueService } from "./queue.service";
import { UpdateLocationDto } from "./dto/update-location.dto";
export declare class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private queueService;
    private jwtService;
    server: Server;
    private readonly logger;
    private connectedClients;
    constructor(queueService: QueueService, jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    joinBarbershopRoom(data: {
        barbershopId: string;
    }, client: Socket): Promise<void>;
    leaveBarbershopRoom(data: {
        barbershopId: string;
    }, client: Socket): Promise<void>;
    updateLocation(dto: UpdateLocationDto, client: Socket): Promise<{
        entryId: string;
        distanceMeters: number;
        isInGeofence: boolean;
        warningThreshold: number;
    }>;
    emitQueueUpdate(barbershopId: string, queueData: any): void;
    emitToUser(userId: string, event: string, data: any): void;
}
