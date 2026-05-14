import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class SupportService {
  private s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-2" });
  private s3Bucket = process.env.AWS_S3_BUCKET || "barberprosuite-media";

  constructor(private prisma: PrismaService) {}

  async uploadAttachment(file: Express.Multer.File): Promise<string> {
    const ext = file.mimetype.includes("png") ? "png" : "jpg";
    const key = `support-attachments/${uuidv4()}.${ext}`;
    const region = process.env.AWS_REGION || "us-east-2";

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return `https://${this.s3Bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  async createTicket(dto: {
    userId?: string;
    email?: string;
    subject: string;
    message: string;
    source?: string;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    attachmentUrl?: string;
  }) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId: dto.userId ?? null,
        email: dto.email ?? null,
        subject: dto.subject,
        message: dto.message,
        source: dto.source ?? "web",
        priority: dto.priority ?? "NORMAL",
        attachmentUrl: dto.attachmentUrl ?? null,
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
