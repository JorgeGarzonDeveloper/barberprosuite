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
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SupportService = class SupportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTicket(dto) {
        const ticket = await this.prisma.supportTicket.create({
            data: {
                userId: dto.userId ?? null,
                email: dto.email ?? null,
                subject: dto.subject,
                message: dto.message,
                source: dto.source ?? "web",
                priority: dto.priority ?? "NORMAL",
            },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
            },
        });
        return {
            success: true,
            ticketId: ticket.id,
            message: "Tu mensaje fue recibido. Te responderemos pronto.",
            ticket,
        };
    }
    async getMyTickets(userId) {
        return this.prisma.supportTicket.findMany({
            where: { userId },
            include: { replies: { orderBy: { createdAt: "asc" } } },
            orderBy: { createdAt: "desc" },
        });
    }
    async getAllTickets(page = 1, limit = 20, status) {
        const where = status ? { status: status } : {};
        const [tickets, total] = await Promise.all([
            this.prisma.supportTicket.findMany({
                where,
                include: {
                    user: { select: { firstName: true, lastName: true, email: true } },
                    replies: { orderBy: { createdAt: "asc" } },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.supportTicket.count({ where }),
        ]);
        return { data: tickets, total, page, limit };
    }
    async replyTicket(ticketId, message, isAdmin = false) {
        const [reply] = await Promise.all([
            this.prisma.supportReply.create({
                data: { ticketId, message, isAdmin },
            }),
            this.prisma.supportTicket.update({
                where: { id: ticketId },
                data: { status: isAdmin ? "IN_PROGRESS" : "OPEN" },
            }),
        ]);
        return reply;
    }
    async closeTicket(ticketId) {
        return this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status: "RESOLVED" },
        });
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportService);
//# sourceMappingURL=support.service.js.map