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
var QueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const geo_service_1 = require("../geo/geo.service");
const client_1 = require("@prisma/client");
const GEOFENCE_RADIUS_METERS = 500;
const GEOFENCE_WARNING_THRESHOLD = 450;
const LOCATION_CHECK_INTERVAL_SECONDS = 30;
let QueueService = QueueService_1 = class QueueService {
    constructor(prisma, notifications, geo, queueBull) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.geo = geo;
        this.queueBull = queueBull;
        this.logger = new common_1.Logger(QueueService_1.name);
    }
    async getAvailableBarbers(barbershopId) {
        const barbers = await this.prisma.barberProfile.findMany({
            where: { barbershopId, isAvailable: true },
            include: {
                user: { select: { firstName: true, lastName: true, avatarUrl: true } },
                queueEntries: {
                    where: { status: { in: ["WAITING", "IN_SERVICE"] } },
                    select: { id: true },
                },
            },
        });
        return barbers.map((b) => ({
            id: b.id,
            firstName: b.user.firstName,
            lastName: b.user.lastName,
            avatarUrl: b.user.avatarUrl,
            specialties: b.specialties,
            rating: b.rating,
            queueLength: b.queueEntries.length,
            estimatedWaitMinutes: b.queueEntries.length * 30,
        }));
    }
    async getBarberQueue(userId) {
        const barberProfile = await this.prisma.barberProfile.findUnique({
            where: { userId },
            include: { barbershop: { select: { name: true } } },
        });
        if (!barberProfile)
            throw new common_1.NotFoundException("Perfil de barbero no encontrado");
        const entries = await this.prisma.queueEntry.findMany({
            where: {
                barbershopId: barberProfile.barbershopId,
                barberId: barberProfile.id,
                status: { in: ["WAITING", "IN_SERVICE"] },
            },
            include: {
                client: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
            },
            orderBy: { position: "asc" },
        });
        return {
            barbershopName: barberProfile.barbershop?.name,
            totalWaiting: entries.filter((e) => e.status === "WAITING").length,
            inService: entries.find((e) => e.status === "IN_SERVICE") ?? null,
            queue: entries.map((e) => this.formatEntry(e)),
        };
    }
    async callNextForBarber(userId) {
        const barberProfile = await this.prisma.barberProfile.findUnique({ where: { userId } });
        if (!barberProfile)
            throw new common_1.NotFoundException("Perfil de barbero no encontrado");
        return this.callNext(barberProfile.barbershopId, barberProfile.id);
    }
    async completeCurrentService(userId) {
        const barberProfile = await this.prisma.barberProfile.findUnique({ where: { userId } });
        if (!barberProfile)
            throw new common_1.NotFoundException("Perfil de barbero no encontrado");
        const current = await this.prisma.queueEntry.findFirst({
            where: { barberId: barberProfile.id, status: "IN_SERVICE" },
        });
        if (!current)
            throw new common_1.NotFoundException("No tienes un turno en curso");
        return this.completeService(current.id, barberProfile.barbershopId);
    }
    async getMyEntry(userId) {
        const clientProfile = await this.prisma.clientProfile.findUnique({
            where: { userId },
        });
        if (!clientProfile)
            return null;
        const entry = await this.prisma.queueEntry.findFirst({
            where: {
                clientId: clientProfile.id,
                status: { in: ["WAITING", "IN_SERVICE"] },
            },
            include: {
                client: { include: { user: true } },
                barbershop: { select: { name: true } },
                barber: { include: { user: { select: { firstName: true, lastName: true } } } },
            },
            orderBy: { joinedAt: "desc" },
        });
        if (!entry)
            return null;
        return {
            ...this.formatEntry(entry),
            barbershopName: entry.barbershop.name,
        };
    }
    async getQueue(barbershopId) {
        const [shop, entries] = await Promise.all([
            this.prisma.barbershop.findUnique({
                where: { id: barbershopId },
                select: { name: true, workingHours: true, isActive: true },
            }),
            this.prisma.queueEntry.findMany({
                where: { barbershopId, status: { in: ["WAITING", "IN_SERVICE"] } },
                include: {
                    client: {
                        include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
                    },
                },
                orderBy: { position: "asc" },
            }),
        ]);
        if (!shop)
            throw new common_1.NotFoundException("Barbería no encontrada");
        const totalWaiting = entries.filter((e) => e.status === "WAITING").length;
        const avgServiceTime = 30;
        return {
            barbershopId,
            barbershopName: shop.name,
            totalWaiting,
            estimatedWaitMinutes: totalWaiting * avgServiceTime,
            entries: entries.map((e) => this.formatEntry(e)),
            isOpen: shop.isActive,
        };
    }
    async joinQueue(userId, dto) {
        const clientProfile = await this.prisma.clientProfile.findUnique({
            where: { userId },
        });
        if (!clientProfile) {
            throw new common_1.BadRequestException("Perfil de cliente no encontrado");
        }
        const clientId = clientProfile.id;
        const shop = await this.prisma.barbershop.findFirst({
            where: { id: dto.barbershopId, qrSecret: dto.qrSecret, isActive: true },
        });
        if (!shop) {
            throw new common_1.BadRequestException("QR inválido o barbería no encontrada");
        }
        const alreadyInQueue = await this.prisma.queueEntry.findFirst({
            where: {
                clientId,
                barbershopId: dto.barbershopId,
                status: { in: ["WAITING", "IN_SERVICE"] },
            },
        });
        if (alreadyInQueue) {
            throw new common_1.ConflictException("Ya estás en la fila de esta barbería");
        }
        const distance = this.geo.calculateDistance({ lat: dto.latitude, lng: dto.longitude }, { lat: shop.latitude, lng: shop.longitude });
        if (distance > GEOFENCE_RADIUS_METERS) {
            throw new common_1.BadRequestException(`Debes estar a menos de ${GEOFENCE_RADIUS_METERS}m de la barbería para unirte a la fila (estás a ${Math.round(distance)}m)`);
        }
        let resolvedBarberId;
        if (dto.preferredBarberId) {
            const barber = await this.prisma.barberProfile.findFirst({
                where: { id: dto.preferredBarberId, barbershopId: dto.barbershopId, isAvailable: true },
            });
            if (!barber)
                throw new common_1.BadRequestException("Barbero no disponible");
            resolvedBarberId = barber.id;
        }
        const queueFilter = resolvedBarberId
            ? { barbershopId: dto.barbershopId, barberId: resolvedBarberId, status: { in: ["WAITING", "IN_SERVICE"] } }
            : { barbershopId: dto.barbershopId, status: { in: ["WAITING", "IN_SERVICE"] } };
        const lastEntry = await this.prisma.queueEntry.findFirst({
            where: queueFilter,
            orderBy: { position: "desc" },
        });
        const position = (lastEntry?.position ?? 0) + 1;
        const waitingAhead = position - 1;
        const estimatedWaitMinutes = waitingAhead * 30;
        const entry = await this.prisma.queueEntry.create({
            data: {
                barbershopId: dto.barbershopId,
                clientId,
                barberId: resolvedBarberId ?? null,
                position,
                estimatedWaitMinutes,
                status: client_1.QueueStatus.WAITING,
                lastLocationLat: dto.latitude,
                lastLocationLng: dto.longitude,
                lastLocationUpdatedAt: new Date(),
            },
            include: {
                client: { include: { user: true } },
                barbershop: true,
            },
        });
        await this.queueBull.add("check-geofence", { entryId: entry.id, barbershopId: dto.barbershopId }, {
            delay: LOCATION_CHECK_INTERVAL_SECONDS * 1000,
            repeat: { every: LOCATION_CHECK_INTERVAL_SECONDS * 1000 },
            jobId: `geofence-${entry.id}`,
        });
        const clientUser = entry.client.user;
        await this.notifications.notify(clientUser.id, "QUEUE_JOINED", "Unido a la fila", `Estás en la posición #${position} de ${entry.barbershop.name}. Espera aprox. ${estimatedWaitMinutes} min.`, { type: "QUEUE_JOINED", entryId: entry.id, barbershopId: dto.barbershopId, position: String(position) }, clientUser.fcmToken ?? dto.fcmToken);
        const clientName = `${clientUser.firstName} ${clientUser.lastName}`;
        if (resolvedBarberId) {
            const barber = await this.prisma.barberProfile.findUnique({
                where: { id: resolvedBarberId },
                include: { user: { select: { id: true, fcmToken: true } } },
            });
            if (barber) {
                await this.notifications.notify(barber.user.id, "QUEUE_CLIENT_JOINED", "Nuevo cliente en tu fila", `${clientName} se unió a tu fila en la posición #${position}.`, { type: "QUEUE_CLIENT_JOINED", entryId: entry.id, barbershopId: dto.barbershopId }, barber.user.fcmToken ?? undefined);
            }
        }
        else {
            const allBarbers = await this.prisma.barberProfile.findMany({
                where: { barbershopId: dto.barbershopId, isAvailable: true },
                include: { user: { select: { id: true, fcmToken: true } } },
            });
            for (const barber of allBarbers) {
                await this.notifications.notify(barber.user.id, "QUEUE_CLIENT_JOINED", "Nuevo cliente en la fila", `${clientName} se unió a la fila general. Posición #${position}.`, { type: "QUEUE_CLIENT_JOINED", entryId: entry.id, barbershopId: dto.barbershopId }, barber.user.fcmToken ?? undefined);
            }
        }
        this.logger.log(`Cliente ${clientId} unido a fila de ${shop.name} en posición ${position}`);
        return this.formatEntry(entry);
    }
    async updateLocation(userId, dto) {
        const clientProfile = await this.prisma.clientProfile.findUnique({
            where: { userId },
        });
        if (!clientProfile)
            throw new common_1.NotFoundException("Perfil de cliente no encontrado");
        const clientId = clientProfile.id;
        const entry = await this.prisma.queueEntry.findFirst({
            where: { id: dto.queueEntryId, clientId, status: "WAITING" },
            include: { barbershop: true, client: { include: { user: true } } },
        });
        if (!entry) {
            throw new common_1.NotFoundException("Entrada en fila no encontrada");
        }
        const distance = this.geo.calculateDistance({ lat: dto.latitude, lng: dto.longitude }, { lat: entry.barbershop.latitude, lng: entry.barbershop.longitude });
        const updatedEntry = await this.prisma.queueEntry.update({
            where: { id: entry.id },
            data: {
                lastLocationLat: dto.latitude,
                lastLocationLng: dto.longitude,
                lastLocationUpdatedAt: new Date(),
            },
        });
        if (distance > GEOFENCE_RADIUS_METERS) {
            await this.handleGeofenceLost(entry);
        }
        else if (distance > GEOFENCE_WARNING_THRESHOLD) {
            await this.handleGeofenceWarning(entry, distance);
        }
        return {
            entryId: entry.id,
            distanceMeters: Math.round(distance),
            isInGeofence: distance <= GEOFENCE_RADIUS_METERS,
            warningThreshold: GEOFENCE_WARNING_THRESHOLD,
        };
    }
    async callNext(barbershopId, barberId) {
        const nextEntry = await this.prisma.queueEntry.findFirst({
            where: { barbershopId, status: "WAITING" },
            orderBy: { position: "asc" },
            include: { client: { include: { user: true } } },
        });
        if (!nextEntry) {
            throw new common_1.NotFoundException("No hay clientes en espera");
        }
        const updated = await this.prisma.queueEntry.update({
            where: { id: nextEntry.id },
            data: {
                status: client_1.QueueStatus.IN_SERVICE,
                barberId,
                calledAt: new Date(),
            },
        });
        await this.notifications.notify(nextEntry.client.user.id, "QUEUE_CALLED", "¡Es tu turno!", "El barbero está listo para atenderte. Acércate a la silla.", { type: "QUEUE_CALLED", entryId: nextEntry.id }, nextEntry.client.user.fcmToken ?? undefined);
        await this.updateQueuePositions(barbershopId);
        return this.formatEntry(updated);
    }
    async completeService(entryId, barbershopId) {
        const entry = await this.prisma.queueEntry.update({
            where: { id: entryId },
            data: {
                status: client_1.QueueStatus.COMPLETED,
                servedAt: new Date(),
            },
        });
        const jobs = await this.queueBull.getRepeatableJobs();
        const job = jobs.find((j) => j.id === `geofence-${entryId}`);
        if (job) {
            await this.queueBull.removeRepeatableByKey(job.key);
        }
        await this.updateQueuePositions(barbershopId);
        return entry;
    }
    async leaveQueue(userId, entryId) {
        const clientProfile = await this.prisma.clientProfile.findUnique({
            where: { userId },
        });
        if (!clientProfile)
            throw new common_1.NotFoundException("Perfil de cliente no encontrado");
        const clientId = clientProfile.id;
        const entry = await this.prisma.queueEntry.findFirst({
            where: { id: entryId, clientId, status: { in: ["WAITING", "IN_SERVICE"] } },
        });
        if (!entry)
            throw new common_1.NotFoundException("No estás en esta fila");
        await this.prisma.queueEntry.update({
            where: { id: entry.id },
            data: { status: client_1.QueueStatus.CANCELLED },
        });
        const jobs = await this.queueBull.getRepeatableJobs();
        const job = jobs.find((j) => j.id === `geofence-${entryId}`);
        if (job) {
            await this.queueBull.removeRepeatableByKey(job.key);
        }
        if (entry.barberId) {
            const barber = await this.prisma.barberProfile.findUnique({
                where: { id: entry.barberId },
                include: { user: { select: { id: true, fcmToken: true } } },
            });
            const clientUser = await this.prisma.clientProfile.findUnique({
                where: { id: clientId },
                include: { user: { select: { firstName: true, lastName: true } } },
            });
            if (barber) {
                const clientName = clientUser
                    ? `${clientUser.user.firstName} ${clientUser.user.lastName}`
                    : "Un cliente";
                await this.notifications.notify(barber.user.id, "QUEUE_CLIENT_LEFT", "Cliente abandonó la fila", `${clientName} salió de tu fila.`, { type: "QUEUE_CLIENT_LEFT", barbershopId: entry.barbershopId }, barber.user.fcmToken ?? undefined);
            }
        }
        await this.updateQueuePositions(entry.barbershopId);
    }
    async handleGeofenceLost(entry) {
        await this.prisma.queueEntry.update({
            where: { id: entry.id },
            data: { status: client_1.QueueStatus.GEOFENCE_LOST },
        });
        await this.notifications.notify(entry.client.user.id, "QUEUE_GEOFENCE_LOST", "Perdiste tu lugar en la fila", `Te alejaste más de ${GEOFENCE_RADIUS_METERS}m de ${entry.barbershop.name}. Tu lugar fue liberado.`, { type: "QUEUE_GEOFENCE_LOST", entryId: entry.id }, entry.client.user.fcmToken ?? undefined);
        await this.updateQueuePositions(entry.barbershopId);
        this.logger.warn(`Cliente ${entry.clientId} perdió su lugar en fila por geofence`);
    }
    async handleGeofenceWarning(entry, distance) {
        if (entry.geofenceWarningsSent >= 3)
            return;
        await this.prisma.queueEntry.update({
            where: { id: entry.id },
            data: { geofenceWarningsSent: { increment: 1 } },
        });
        const fcmToken = entry.client.user.fcmToken;
        if (fcmToken) {
            await this.notifications.sendPush({
                token: fcmToken,
                title: "Advertencia: te estás alejando",
                body: `Estás a ${Math.round(distance)}m de ${entry.barbershop.name}. Si pasas ${GEOFENCE_RADIUS_METERS}m, perderás tu lugar.`,
                data: {
                    type: "QUEUE_GEOFENCE_WARNING",
                    entryId: entry.id,
                    distance: String(Math.round(distance)),
                },
            });
        }
    }
    async updateQueuePositions(barbershopId) {
        const waitingEntries = await this.prisma.queueEntry.findMany({
            where: { barbershopId, status: "WAITING" },
            orderBy: [{ joinedAt: "asc" }],
            include: { client: { include: { user: true } } },
        });
        await Promise.all(waitingEntries.map((entry, index) => this.prisma.queueEntry.update({
            where: { id: entry.id },
            data: {
                position: index + 1,
                estimatedWaitMinutes: index * 30,
            },
        })));
        for (let i = 0; i < waitingEntries.length; i++) {
            if (i === 0)
                continue;
            const entry = waitingEntries[i];
            await this.notifications.notify(entry.client.user.id, "QUEUE_POSITION_UPDATED", "Actualización de fila", `Ahora eres el #${i + 1} en la fila. Espera aprox. ${i * 30} min.`, { type: "QUEUE_POSITION_UPDATED", entryId: entry.id, position: String(i + 1), estimatedWaitMinutes: String(i * 30) }, entry.client.user.fcmToken ?? undefined);
        }
    }
    formatEntry(entry) {
        return {
            id: entry.id,
            barbershopId: entry.barbershopId,
            clientId: entry.clientId,
            barberId: entry.barberId,
            position: entry.position,
            estimatedWaitMinutes: entry.estimatedWaitMinutes,
            status: entry.status,
            joinedAt: entry.joinedAt,
            calledAt: entry.calledAt,
            servedAt: entry.servedAt,
            clientName: entry.client?.user
                ? `${entry.client.user.firstName} ${entry.client.user.lastName}`
                : undefined,
            clientAvatarUrl: entry.client?.user?.avatarUrl,
            barberName: entry.barber?.user
                ? `${entry.barber.user.firstName} ${entry.barber.user.lastName}`
                : undefined,
        };
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = QueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, bull_1.InjectQueue)("virtual-queue")),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        geo_service_1.GeoService, Object])
], QueueService);
//# sourceMappingURL=queue.service.js.map