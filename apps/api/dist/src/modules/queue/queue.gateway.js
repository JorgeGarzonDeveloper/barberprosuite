"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var QueueGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const queue_service_1 = require("./queue.service");
const update_location_dto_1 = require("./dto/update-location.dto");
let QueueGateway = QueueGateway_1 = class QueueGateway {
    constructor(queueService, jwtService) {
        this.queueService = queueService;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(QueueGateway_1.name);
        this.connectedClients = new Map();
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token ||
                client.handshake.headers.authorization?.replace("Bearer ", "");
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            this.connectedClients.set(client.id, payload.sub);
            client.data.userId = payload.sub;
            this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
        }
        catch (err) {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.connectedClients.delete(client.id);
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    async joinBarbershopRoom(data, client) {
        await client.join(`barbershop:${data.barbershopId}`);
        const queue = await this.queueService.getQueue(data.barbershopId);
        client.emit("queue-update", queue);
    }
    async leaveBarbershopRoom(data, client) {
        await client.leave(`barbershop:${data.barbershopId}`);
    }
    async updateLocation(dto, client) {
        const userId = client.data.userId;
        if (!userId)
            throw new websockets_1.WsException("No autenticado");
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
    emitQueueUpdate(barbershopId, queueData) {
        this.server.to(`barbershop:${barbershopId}`).emit("queue-update", queueData);
    }
    emitToUser(userId, event, data) {
        for (const [socketId, uid] of this.connectedClients.entries()) {
            if (uid === userId) {
                this.server.to(socketId).emit(event, data);
            }
        }
    }
};
exports.QueueGateway = QueueGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], QueueGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)("join-barbershop-room"),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "joinBarbershopRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("leave-barbershop-room"),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "leaveBarbershopRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("update-location"),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_location_dto_1.UpdateLocationDto,
        socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], QueueGateway.prototype, "updateLocation", null);
exports.QueueGateway = QueueGateway = QueueGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: "*",
            credentials: true,
        },
        namespace: "/queue",
        transports: ["websocket", "polling"],
    }),
    __metadata("design:paramtypes", [queue_service_1.QueueService,
        jwt_1.JwtService])
], QueueGateway);
//# sourceMappingURL=queue.gateway.js.map