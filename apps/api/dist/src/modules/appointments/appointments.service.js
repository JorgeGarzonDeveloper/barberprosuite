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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
let AppointmentsService = class AppointmentsService {
    constructor(prisma, notifications, queue) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.queue = queue;
    }
    async getAvailableSlots(barbershopId, barberId, date) {
        const barber = await this.prisma.barberProfile.findFirst({
            where: { id: barberId, barbershopId },
        });
        if (!barber)
            throw new common_1.NotFoundException("Barbero no encontrado");
        const targetDate = new Date(date);
        const dayOfWeek = targetDate.getDay();
        const workingHours = barber.workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);
        if (!workingHours?.isOpen) {
            return { slots: [], message: "El barbero no trabaja este día" };
        }
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const existingAppointments = await this.prisma.appointment.findMany({
            where: {
                barberId,
                scheduledAt: { gte: startOfDay, lte: endOfDay },
                status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
            },
            include: { service: true },
        });
        const [openHour, openMin] = workingHours.openTime.split(":").map(Number);
        const [closeHour, closeMin] = workingHours.closeTime.split(":").map(Number);
        const slots = [];
        let current = new Date(targetDate);
        current.setHours(openHour, openMin, 0, 0);
        const closeTime = new Date(targetDate);
        closeTime.setHours(closeHour, closeMin, 0, 0);
        while ((0, date_fns_1.isBefore)(current, closeTime)) {
            const slotEnd = (0, date_fns_1.addMinutes)(current, 30);
            const isBooked = existingAppointments.some((appt) => {
                const apptStart = new Date(appt.scheduledAt);
                const apptEnd = (0, date_fns_1.addMinutes)(apptStart, appt.durationMinutes);
                return (((0, date_fns_1.isAfter)(current, apptStart) && (0, date_fns_1.isBefore)(current, apptEnd)) ||
                    current.getTime() === apptStart.getTime());
            });
            slots.push({
                startTime: (0, date_fns_1.format)(current, "HH:mm"),
                endTime: (0, date_fns_1.format)(slotEnd, "HH:mm"),
                isAvailable: !isBooked && (0, date_fns_1.isAfter)(current, new Date()),
            });
            current = slotEnd;
        }
        return { slots };
    }
    async create(clientId, dto) {
        const [service, barber] = await Promise.all([
            this.prisma.service.findUnique({ where: { id: dto.serviceId } }),
            this.prisma.barberProfile.findUnique({
                where: { id: dto.barberId },
                include: { user: true },
            }),
        ]);
        if (!service)
            throw new common_1.NotFoundException("Servicio no encontrado");
        if (!barber)
            throw new common_1.NotFoundException("Barbero no encontrado");
        const scheduledAt = new Date(dto.scheduledAt);
        const scheduledEnd = (0, date_fns_1.addMinutes)(scheduledAt, service.durationMinutes);
        const conflict = await this.prisma.appointment.findFirst({
            where: {
                barberId: dto.barberId,
                status: { in: ["PENDING", "CONFIRMED"] },
                AND: [
                    { scheduledAt: { lt: scheduledEnd } },
                    {
                        scheduledAt: {
                            gte: (0, date_fns_1.addMinutes)(scheduledAt, -service.durationMinutes),
                        },
                    },
                ],
            },
        });
        if (conflict) {
            throw new common_1.ConflictException("El barbero ya tiene una cita en ese horario");
        }
        const clientProfile = await this.prisma.clientProfile.findUnique({
            where: { userId: clientId },
        });
        if (!clientProfile)
            throw new common_1.NotFoundException("Perfil de cliente no encontrado");
        const appointment = await this.prisma.appointment.create({
            data: {
                barbershopId: dto.barbershopId,
                barberId: dto.barberId,
                clientId: clientProfile.id,
                serviceId: dto.serviceId,
                scheduledAt,
                durationMinutes: service.durationMinutes,
                price: service.price,
                notes: dto.notes,
                status: "CONFIRMED",
            },
            include: {
                barbershop: true,
                service: true,
                barber: { include: { user: true } },
            },
        });
        const reminderTimes = [
            { minutesBefore: 24 * 60, label: "24h" },
            { minutesBefore: 60, label: "1h" },
        ];
        for (const reminder of reminderTimes) {
            const fireAt = (0, date_fns_1.addMinutes)(scheduledAt, -reminder.minutesBefore);
            if ((0, date_fns_1.isAfter)(fireAt, new Date())) {
                await this.queue.add("send-appointment-reminder", {
                    appointmentId: appointment.id,
                    minutesBefore: reminder.minutesBefore,
                }, { delay: fireAt.getTime() - Date.now() });
            }
        }
        const client = await this.prisma.user.findUnique({ where: { id: clientId } });
        const dateStr = (0, date_fns_1.format)(scheduledAt, "d 'de' MMMM 'a las' HH:mm", { locale: locale_1.es });
        await this.notifications.notify(clientId, "APPOINTMENT_CONFIRMED", "Cita confirmada", `Tu cita de ${service.name} en ${appointment.barbershop.name} el ${dateStr} está confirmada.`, { type: "APPOINTMENT_CONFIRMED", appointmentId: appointment.id }, client?.fcmToken ?? undefined);
        await this.notifications.notify(barber.user.id, "APPOINTMENT_BOOKED", "Nueva cita agendada", `${client?.firstName ?? "Un cliente"} ${client?.lastName ?? ""} agendó ${service.name} el ${dateStr}.`, { type: "APPOINTMENT_BOOKED", appointmentId: appointment.id }, barber.user.fcmToken ?? undefined);
        return appointment;
    }
    async getClientAppointments(clientId, status) {
        const clientProfile = await this.prisma.clientProfile.findUnique({
            where: { userId: clientId },
        });
        if (!clientProfile)
            return [];
        return this.prisma.appointment.findMany({
            where: {
                clientId: clientProfile.id,
                ...(status ? { status: status } : {}),
            },
            include: {
                barbershop: true,
                service: true,
                barber: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
            },
            orderBy: { scheduledAt: "desc" },
        });
    }
    async getBarberAppointments(userId, status) {
        const barberProfile = await this.prisma.barberProfile.findUnique({ where: { userId } });
        if (!barberProfile)
            return [];
        return this.prisma.appointment.findMany({
            where: {
                barberId: barberProfile.id,
                ...(status ? { status: status } : {}),
            },
            include: {
                barbershop: true,
                service: true,
                client: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true, phone: true } } } },
            },
            orderBy: { scheduledAt: "desc" },
        });
    }
    async confirmAppointment(appointmentId, userId) {
        const barberProfile = await this.prisma.barberProfile.findUnique({ where: { userId } });
        if (!barberProfile)
            throw new common_1.NotFoundException("Perfil de barbero no encontrado");
        const appointment = await this.prisma.appointment.findFirst({
            where: { id: appointmentId, barberId: barberProfile.id, status: "PENDING" },
        });
        if (!appointment)
            throw new common_1.NotFoundException("Cita no encontrada o ya fue procesada");
        return this.prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: "CONFIRMED" },
        });
    }
    async completeAppointment(appointmentId, userId) {
        const barberProfile = await this.prisma.barberProfile.findUnique({ where: { userId } });
        if (!barberProfile)
            throw new common_1.NotFoundException("Perfil de barbero no encontrado");
        const appointment = await this.prisma.appointment.findFirst({
            where: { id: appointmentId, barberId: barberProfile.id, status: { in: ["CONFIRMED", "IN_PROGRESS"] } },
        });
        if (!appointment)
            throw new common_1.NotFoundException("Cita no encontrada o ya fue completada");
        return this.prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: "COMPLETED", completedAt: new Date() },
        });
    }
    async cancel(appointmentId, userId, reason) {
        const appointment = await this.prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                status: { in: ["PENDING", "CONFIRMED"] },
                client: { userId },
            },
            include: { client: true, barbershop: true, service: true },
        });
        if (!appointment)
            throw new common_1.NotFoundException("Cita no encontrada o no puede cancelarse");
        await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: "CANCELLED",
                cancellationReason: reason,
                cancelledAt: new Date(),
            },
        });
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bull_1.InjectQueue)("virtual-queue")),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService, Object])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map