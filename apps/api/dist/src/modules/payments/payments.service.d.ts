import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { WompiService } from "./wompi.service";
import { NequiService } from "./nequi.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PaymentMethod } from "@prisma/client";
export declare class PaymentsService {
    private prisma;
    private wompi;
    private nequi;
    private notifications;
    private config;
    private readonly logger;
    constructor(prisma: PrismaService, wompi: WompiService, nequi: NequiService, notifications: NotificationsService, config: ConfigService);
    getPseBanks(): Promise<any>;
    createSubscriptionPayment(subscriptionId: string, method: PaymentMethod, params?: any): Promise<{
        paymentId: string;
        redirectUrl: any;
        transactionId: any;
        paymentLinkUrl?: undefined;
        instructions?: undefined;
        nequiNumber?: undefined;
        reference?: undefined;
        amount?: undefined;
    } | {
        paymentId: string;
        paymentLinkUrl: any;
        redirectUrl?: undefined;
        transactionId?: undefined;
        instructions?: undefined;
        nequiNumber?: undefined;
        reference?: undefined;
        amount?: undefined;
    } | {
        paymentId: string;
        instructions: {
            bank: string;
            accountType: string;
            accountNumber: string;
            beneficiary: string;
            nit: string;
            reference: string;
            amount: number;
            notes: string;
        };
        redirectUrl?: undefined;
        transactionId?: undefined;
        paymentLinkUrl?: undefined;
        nequiNumber?: undefined;
        reference?: undefined;
        amount?: undefined;
    } | {
        paymentId: string;
        nequiNumber: string;
        reference: string;
        amount: number;
        instructions: string;
        redirectUrl?: undefined;
        transactionId?: undefined;
        paymentLinkUrl?: undefined;
    }>;
    handleWebhook(body: any, signature: string): Promise<void>;
    getPaymentHistory(barbershopId: string, page?: number, limit?: number): Promise<{
        data: any[];
        total: number;
        page?: undefined;
        limit?: undefined;
    } | {
        data: {
            id: string;
            status: import("@prisma/client").$Enums.PaymentStatus;
            createdAt: Date;
            updatedAt: Date;
            appointmentId: string | null;
            subscriptionId: string | null;
            currency: string;
            transactionId: string | null;
            amount: number;
            commissionAmount: number | null;
            barberAmount: number | null;
            method: import("@prisma/client").$Enums.PaymentMethod;
            referenceId: string | null;
            receipt: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    createBarberCheckoutLink(subscriptionId: string, email: string, planName: string, customRedirectUrl?: string): Promise<{
        checkoutUrl: string;
        reference: string;
    }>;
    createAppointmentCheckoutLink(clientUserId: string, dto: {
        barbershopId: string;
        barberId: string;
        serviceIds: string[];
        scheduledAt: string;
        notes?: string;
    }): Promise<{
        checkoutUrl: string;
        appointmentId: string;
        reference: string;
        services: {
            id: string;
            name: string;
            price: number;
        }[];
        servicePrice: number;
        commissionAmount: number;
        totalAmount: number;
    }>;
    createAppointmentNequiCheckout(clientUserId: string, dto: {
        barbershopId: string;
        barberId: string;
        serviceIds: string[];
        scheduledAt: string;
        phoneNumber: string;
        notes?: string;
    }): Promise<{
        appointmentId: string;
        reference: string;
        services: {
            id: string;
            name: string;
            price: number;
        }[];
        servicePrice: number;
        commissionAmount: number;
        totalAmount: number;
        message: string;
    }>;
    getNequiPaymentStatus(reference: string): Promise<{
        status: string;
        appointmentId: any;
    }>;
}
