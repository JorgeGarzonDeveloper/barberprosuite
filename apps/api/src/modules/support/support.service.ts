import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createTicket(dto: {
    userId?: string;
    email?: string;
    subject: string;
    message: string;
    source?: string;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  }) {
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

  async getMyTickets(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      include: { replies: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAllTickets(page = 1, limit = 20, status?: string) {
    const where = status ? { status: status as any } : {};
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

  async replyTicket(ticketId: string, message: string, isAdmin = false) {
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

  async closeTicket(ticketId: string) {
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "RESOLVED" },
    });
  }
}
