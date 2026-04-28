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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarberService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let BarberService = class BarberService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyProfile(userId) {
        const profile = await this.prisma.barberProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
                        status: true,
                    },
                },
                barbershop: {
                    include: {
                        services: { where: { isActive: true }, orderBy: { name: "asc" } },
                        subscription: { include: { plan: true } },
                        _count: { select: { appointments: true, queueEntries: true } },
                    },
                },
            },
        });
        if (!profile) {
            throw new common_1.NotFoundException("Perfil de barbero no encontrado");
        }
        return profile;
    }
    async verifyBarberBelongsToBarbershop(userId, barbershopId) {
        const profile = await this.prisma.barberProfile.findFirst({
            where: { userId, barbershopId },
        });
        if (!profile) {
            throw new common_1.ForbiddenException("No tienes permiso para gestionar esta barbería");
        }
        return profile;
    }
    async getMyServices(userId) {
        const profile = await this.prisma.barberProfile.findUnique({
            where: { userId },
            select: { id: true, barbershopId: true },
        });
        if (!profile?.barbershopId)
            return [];
        return this.prisma.service.findMany({
            where: { barberId: profile.id, isActive: true },
            orderBy: { name: "asc" },
        });
    }
    async getServicesByBarber(barberId) {
        return this.prisma.service.findMany({
            where: { barberId, isActive: true },
            orderBy: { name: "asc" },
        });
    }
    async createService(userId, dto) {
        const profile = await this.prisma.barberProfile.findUnique({
            where: { userId },
            select: { id: true, barbershopId: true },
        });
        if (!profile?.barbershopId) {
            throw new common_1.ForbiddenException("Debes estar asignado a una barbería para crear servicios");
        }
        return this.prisma.service.create({
            data: {
                ...dto,
                barbershopId: profile.barbershopId,
                barberId: profile.id,
            },
        });
    }
    async updateService(userId, serviceId, dto) {
        const service = await this.prisma.service.findUnique({
            where: { id: serviceId },
        });
        if (!service)
            throw new common_1.NotFoundException("Servicio no encontrado");
        await this.verifyBarberBelongsToBarbershop(userId, service.barbershopId);
        return this.prisma.service.update({
            where: { id: serviceId },
            data: dto,
        });
    }
    async deleteService(userId, serviceId) {
        const service = await this.prisma.service.findUnique({
            where: { id: serviceId },
        });
        if (!service)
            throw new common_1.NotFoundException("Servicio no encontrado");
        await this.verifyBarberBelongsToBarbershop(userId, service.barbershopId);
        return this.prisma.service.update({
            where: { id: serviceId },
            data: { isActive: false },
        });
    }
    async getMyStats(userId) {
        const profile = await this.prisma.barberProfile.findUnique({
            where: { userId },
            select: { barbershopId: true, id: true },
        });
        if (!profile?.barbershopId) {
            return { todayAppointments: 0, monthAppointments: 0, services: 0 };
        }
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const [todayAppointments, monthAppointments, services] = await Promise.all([
            this.prisma.appointment.count({
                where: {
                    barbershopId: profile.barbershopId,
                    barberId: profile.id,
                    scheduledAt: { gte: startOfToday },
                },
            }),
            this.prisma.appointment.count({
                where: {
                    barbershopId: profile.barbershopId,
                    barberId: profile.id,
                    scheduledAt: { gte: startOfMonth },
                },
            }),
            this.prisma.service.count({
                where: { barbershopId: profile.barbershopId, isActive: true },
            }),
        ]);
        return { todayAppointments, monthAppointments, services };
    }
    async getMyAppointments(userId, page = 1, limit = 20) {
        const profile = await this.prisma.barberProfile.findUnique({
            where: { userId },
            select: { id: true, barbershopId: true },
        });
        if (!profile?.barbershopId)
            return { data: [], total: 0 };
        const where = {
            barberId: profile.id,
            barbershopId: profile.barbershopId,
        };
        const [data, total] = await Promise.all([
            this.prisma.appointment.findMany({
                where,
                include: {
                    service: { select: { name: true, price: true, durationMinutes: true } },
                    client: {
                        include: {
                            user: { select: { firstName: true, lastName: true, phone: true } },
                        },
                    },
                },
                orderBy: { scheduledAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.appointment.count({ where }),
        ]);
        return { data, total, page, limit };
    }
};
exports.BarberService = BarberService;
exports.BarberService = BarberService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BarberService);
//# sourceMappingURL=barber.service.js.map