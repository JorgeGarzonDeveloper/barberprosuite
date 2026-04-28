import { SupportService } from "./support.service";
export declare class SupportController {
    private supportService;
    constructor(supportService: SupportService);
    createTicket(body: {
        subject?: string;
        message: string;
        email?: string;
        source?: string;
        priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    }, req: any): Promise<{
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
    getMyTickets(req: any): Promise<({
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
    replyTicket(ticketId: string, message: string): Promise<{
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
