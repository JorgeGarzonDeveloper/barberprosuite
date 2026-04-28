import { PrismaService } from "../../prisma/prisma.service";
export declare class SupportService {
    private prisma;
    constructor(prisma: PrismaService);
    createTicket(dto: {
        userId?: string;
        email?: string;
        subject: string;
        message: string;
        source?: string;
        priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    }): Promise<{
        success: boolean;
        ticketId: string;
        message: string;
        ticket: {
            user: {
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            email: string | null;
            status: import("@prisma/client").$Enums.SupportTicketStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            message: string;
            subject: string;
            priority: import("@prisma/client").$Enums.SupportPriority;
            source: string;
        };
    }>;
    getMyTickets(userId: string): Promise<({
        replies: {
            id: string;
            createdAt: Date;
            message: string;
            ticketId: string;
            isAdmin: boolean;
        }[];
    } & {
        id: string;
        email: string | null;
        status: import("@prisma/client").$Enums.SupportTicketStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        message: string;
        subject: string;
        priority: import("@prisma/client").$Enums.SupportPriority;
        source: string;
    })[]>;
    getAllTickets(page?: number, limit?: number, status?: string): Promise<{
        data: ({
            user: {
                email: string;
                firstName: string;
                lastName: string;
            };
            replies: {
                id: string;
                createdAt: Date;
                message: string;
                ticketId: string;
                isAdmin: boolean;
            }[];
        } & {
            id: string;
            email: string | null;
            status: import("@prisma/client").$Enums.SupportTicketStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            message: string;
            subject: string;
            priority: import("@prisma/client").$Enums.SupportPriority;
            source: string;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    replyTicket(ticketId: string, message: string, isAdmin?: boolean): Promise<{
        id: string;
        createdAt: Date;
        message: string;
        ticketId: string;
        isAdmin: boolean;
    }>;
    closeTicket(ticketId: string): Promise<{
        id: string;
        email: string | null;
        status: import("@prisma/client").$Enums.SupportTicketStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        message: string;
        subject: string;
        priority: import("@prisma/client").$Enums.SupportPriority;
        source: string;
    }>;
}
