import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { addMinutes, isAfter, isBefore, format } from "date-fns";
import { es } from "date-fns/locale";

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    @InjectQueue("virtual-queue") private queue: Queue
  ) {}

  async getAvailableSlots(barbershopId: string, barberId: string, date: string) {
    const barber = await this.prisma.barberProfile.findFirst({
      where: { id: barberId, barbershopId },
    });

    if (!barber) throw new NotFoundException("Barbero no encontrado");

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    const workingHours = (barber.workingHours as any[]).find(
      (wh: any) => wh.dayOfWeek === dayOfWeek
    );

    if (!workingHours?.isOpen) {
      return { slots: [], message: "El barbero no trabaja este día" };
    }

    // Obtener citas existentes del día
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

    // Generar slots de 30 minutos
    const [openHour, openMin] = workingHours.openTime.split(":").map(Number);
    const [closeHour, closeMin] = workingHours.closeTime.split(":").map(Number);

    const slots = [];
    let current = new Date(targetDate);
    current.setHours(openHour, openMin, 0, 0);
    const closeTime = new Date(targetDate);
    closeTime.setHours(closeHour, closeMin, 0, 0);

    while (isBefore(current, closeTime)) {
      const slotEnd = addMinutes(current, 30);
      const isBooked = existingAppointments.some((appt) => {
        const apptStart = new Date(appt.scheduledAt);
        const apptEnd = addMinutes(apptStart, appt.durationMinutes);
        return (
          (isAfter(current, apptStart) && isBefore(current, apptEnd)) ||
          current.getTime() === apptStart.getTime()
        );
      });

      slots.push({
        startTime: format(current, "HH:mm"),
        endTime: format(slotEnd, "HH:mm"),
        isAvailable: !isBooked && isAfter(current, new Date()),
      });

      current = slotEnd;
    }

    return { slots };
  }

  async create(clientId: string, dto: CreateAppointmentDto) {
    const [service, barber] = await Promise.all([
      this.prisma.service.findUnique({ where: { id: dto.serviceId } }),
      this.prisma.barberProfile.findUnique({
        where: { id: dto.barberId },
        include: { user: true },
      }),
    ]);

    if (!service) throw new NotFoundException("Servicio no encontrado");
    if (!barber) throw new NotFoundException("Barbero no encontrado");

    const scheduledAt = new Date(dto.scheduledAt);
    const scheduledEnd = addMinutes(scheduledAt, service.durationMinutes);

    // Verificar conflicto de horario
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        barberId: dto.barberId,
        status: { in: ["PENDING", "CONFIRMED"] },
        AND: [
          { scheduledAt: { lt: scheduledEnd } },
          {
            scheduledAt: {
              gte: addMinutes(scheduledAt, -service.durationMinutes),
            },
          },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException("El barbero ya tiene una cita en ese horario");
    }

    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId: clientId },
    });

    if (!clientProfile) throw new NotFoundException("Perfil de cliente no encontrado");

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

    // Programar recordatorios
    const reminderTimes = [
      { minutesBefore: 24 * 60, label: "24h" },
      { minutesBefore: 60, label: "1h" },
    ];

    for (const reminder of reminderTimes) {
      const fireAt = addMinutes(scheduledAt, -reminder.minutesBefore);
      if (isAfter(fireAt, new Date())) {
        await this.queue.add(
          "send-appointment-reminder",
          {
            appointmentId: appointment.id,
            minutesBefore: reminder.minutesBefore,
          },
          { delay: fireAt.getTime() - Date.now() }
        );
      }
    }

    // Notificar al cliente confirmación
    const client = await this.prisma.user.findUnique({ where: { id: clientId } });
    const dateStr = format(scheduledAt, "d 'de' MMMM 'a las' HH:mm", { locale: es });
    await this.notifications.notify(
      clientId,
      "APPOINTMENT_CONFIRMED",
      "Cita confirmada",
      `Tu cita de ${service.name} en ${appointment.barbershop.name} el ${dateStr} está confirmada.`,
      { type: "APPOINTMENT_CONFIRMED", appointmentId: appointment.id },
      client?.fcmToken ?? undefined,
    );

    // Notificar al barbero que tiene nueva cita
    await this.notifications.notify(
      barber.user.id,
      "APPOINTMENT_BOOKED",
      "Nueva cita agendada",
      `${client?.firstName ?? "Un cliente"} ${client?.lastName ?? ""} agendó ${service.name} el ${dateStr}.`,
      { type: "APPOINTMENT_BOOKED", appointmentId: appointment.id },
      barber.user.fcmToken ?? undefined,
    );

    return appointment;
  }

  async getClientAppointments(clientId: string, status?: string) {
    const clientProfile = await this.prisma.clientProfile.findUnique({
      where: { userId: clientId },
    });

    if (!clientProfile) return [];

    return this.prisma.appointment.findMany({
      where: {
        clientId: clientProfile.id,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        barbershop: true,
        service: true,
        barber: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
      },
      orderBy: { scheduledAt: "desc" },
    });
  }

  async getBarberAppointments(userId: string, status?: string) {
    const barberProfile = await this.prisma.barberProfile.findUnique({ where: { userId } });
    if (!barberProfile) return [];

    return this.prisma.appointment.findMany({
      where: {
        barberId: barberProfile.id,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        barbershop: true,
        service: true,
        client: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true, phone: true } } } },
      },
      orderBy: { scheduledAt: "desc" },
    });
  }

  async confirmAppointment(appointmentId: string, userId: string) {
    const barberProfile = await this.prisma.barberProfile.findUnique({ where: { userId } });
    if (!barberProfile) throw new NotFoundException("Perfil de barbero no encontrado");

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, barberId: barberProfile.id, status: "PENDING" },
    });
    if (!appointment) throw new NotFoundException("Cita no encontrada o ya fue procesada");

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CONFIRMED" },
    });
  }

  async completeAppointment(appointmentId: string, userId: string) {
    const barberProfile = await this.prisma.barberProfile.findUnique({ where: { userId } });
    if (!barberProfile) throw new NotFoundException("Perfil de barbero no encontrado");

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, barberId: barberProfile.id, status: { in: ["CONFIRMED", "IN_PROGRESS"] } },
    });
    if (!appointment) throw new NotFoundException("Cita no encontrada o ya fue completada");

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }

  async cancel(appointmentId: string, userId: string, reason?: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        status: { in: ["PENDING", "CONFIRMED"] },
        client: { userId },
      },
      include: { client: true, barbershop: true, service: true },
    });

    if (!appointment) throw new NotFoundException("Cita no encontrada o no puede cancelarse");

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELLED",
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
    });
  }
}
