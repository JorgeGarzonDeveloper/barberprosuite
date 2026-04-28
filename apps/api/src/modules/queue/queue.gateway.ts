import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { UseGuards, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { QueueService } from "./queue.service";
import { UpdateLocationDto } from "./dto/update-location.dto";

@WebSocketGateway({
  cors: {
    origin: "*",
    credentials: true,
  },
  namespace: "/queue",
  transports: ["websocket", "polling"],
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(QueueGateway.name);
  private connectedClients = new Map<string, string>(); // socketId -> userId

  constructor(
    private queueService: QueueService,
    private jwtService: JwtService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      this.connectedClients.set(client.id, payload.sub);
      client.data.userId = payload.sub;

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch (err) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("join-barbershop-room")
  async joinBarbershopRoom(
    @MessageBody() data: { barbershopId: string },
    @ConnectedSocket() client: Socket
  ) {
    await client.join(`barbershop:${data.barbershopId}`);
    const queue = await this.queueService.getQueue(data.barbershopId);
    client.emit("queue-update", queue);
  }

  @SubscribeMessage("leave-barbershop-room")
  async leaveBarbershopRoom(
    @MessageBody() data: { barbershopId: string },
    @ConnectedSocket() client: Socket
  ) {
    await client.leave(`barbershop:${data.barbershopId}`);
  }

  @SubscribeMessage("update-location")
  async updateLocation(
    @MessageBody() dto: UpdateLocationDto,
    @ConnectedSocket() client: Socket
  ) {
    const userId = client.data.userId;
    if (!userId) throw new WsException("No autenticado");

    const result = await this.queueService.updateLocation(userId, dto);
    client.emit("location-updated", result);

    if (!result.isInGeofence) {
      client.emit("geofence-lost", {
        message: "Has salido de la zona de la barbería",
        distanceMeters: result.distanceMeters,
      });
    }

    return result;
  }

  // Emitir actualización de fila a todos en la sala
  emitQueueUpdate(barbershopId: string, queueData: any) {
    this.server.to(`barbershop:${barbershopId}`).emit("queue-update", queueData);
  }

  // Emitir evento a un cliente específico
  emitToUser(userId: string, event: string, data: any) {
    for (const [socketId, uid] of this.connectedClients.entries()) {
      if (uid === userId) {
        this.server.to(socketId).emit(event, data);
      }
    }
  }
}
