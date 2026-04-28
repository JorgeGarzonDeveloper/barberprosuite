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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = require("bcryptjs");
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats() {
        const [totalUsers, totalBarbershops, totalAppointments, revenue] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.barbershop.count({ where: { isActive: true } }),
            this.prisma.appointment.count(),
            this.prisma.payment.aggregate({
                where: { status: "APPROVED" },
                _sum: { amount: true },
            }),
        ]);
        const activeSubscriptions = await this.prisma.subscription.count({
            where: { status: { in: ["ACTIVE", "TRIAL"] } },
        });
        const newUsersThisMonth = await this.prisma.user.count({
            where: {
                createdAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
            },
        });
        return {
            totalUsers,
            totalBarbershops,
            totalAppointments,
            activeSubscriptions,
            newUsersThisMonth,
            totalRevenue: revenue._sum.amount || 0,
        };
    }
    async getAllUsers(page = 1, limit = 20, role, search) {
        const where = {
            ...(role ? { role: role } : {}),
            ...(search
                ? {
                    OR: [
                        { email: { contains: search, mode: "insensitive" } },
                        { firstName: { contains: search, mode: "insensitive" } },
                        { lastName: { contains: search, mode: "insensitive" } },
                    ],
                }
                : {}),
        };
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    barberProfile: { select: { barbershop: { select: { name: true } } } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.user.count({ where }),
        ]);
        return { data: users, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async getAllBarbershops(page = 1, limit = 20) {
        const [shops, total] = await Promise.all([
            this.prisma.barbershop.findMany({
                include: {
                    owner: { select: { firstName: true, lastName: true, email: true } },
                    subscription: { include: { plan: true } },
                    _count: { select: { barbers: true, appointments: true } },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.barbershop.count(),
        ]);
        return { data: shops, total, page, limit };
    }
    async createBarber(dto) {
        const exists = await this.prisma.user.findFirst({
            where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
        });
        if (exists) {
            throw new common_1.ConflictException(exists.email === dto.email
                ? "Ya existe un usuario con ese correo"
                : "Ya existe un usuario con ese teléfono");
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                passwordHash,
                role: "BARBER",
                status: "PENDING_VERIFICATION",
            },
            select: {
                id: true, email: true, firstName: true, lastName: true,
                phone: true, role: true, status: true, createdAt: true,
            },
        });
        await this.prisma.barberProfile.create({ data: { userId: user.id } });
        return user;
    }
    async updateUserStatus(userId, status) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { status: status },
            select: { id: true, email: true, status: true },
        });
    }
    async getRevenueByMonth() {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const start = new Date(date.getFullYear(), date.getMonth(), 1);
            const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            const revenue = await this.prisma.payment.aggregate({
                where: {
                    status: "APPROVED",
                    createdAt: { gte: start, lte: end },
                },
                _sum: { amount: true },
            });
            months.push({
                month: start.toLocaleString("es-CO", { month: "long", year: "numeric" }),
                revenue: revenue._sum.amount || 0,
            });
        }
        return months;
    }
    async getAllSubscriptions(page = 1, limit = 20) {
        const [subs, total] = await Promise.all([
            this.prisma.subscription.findMany({
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    plan: true,
                    barbershop: { select: { name: true, city: true } },
                    user: { select: { firstName: true, lastName: true, email: true } },
                },
            }),
            this.prisma.subscription.count(),
        ]);
        return { data: subs, total, page, limit };
    }
    async assignBarberToBarbershop(userId, barbershopId) {
        await this.prisma.barberProfile.upsert({
            where: { userId },
            create: { userId, barbershopId },
            update: { barbershopId },
        });
        const sub = await this.prisma.subscription.findFirst({
            where: { userId, barbershopId: null },
        });
        if (sub) {
            await this.prisma.subscription.update({
                where: { id: sub.id },
                data: { barbershopId, status: "ACTIVE" },
            });
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { status: "ACTIVE" },
        });
        return { success: true, message: "Barbero asignado correctamente" };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map