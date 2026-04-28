import { Response } from "express";
import { PaymentsService } from "./payments.service";
export declare class PaymentsController {
    private paymentsService;
    constructor(paymentsService: PaymentsService);
    mobileCallback(id: string, status: string, appointmentId: string, res: Response): void;
    getPseBanks(): Promise<any>;
    createSubscriptionPayment(subscriptionId: string, method: string, params: any): Promise<{
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
    getHistory(barbershopId: string, page?: number, limit?: number): Promise<{
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
    handleWompiWebhook(body: any, signature: string): Promise<void>;
    createCheckoutLink(body: {
        subscriptionId: string;
        planName: string;
        redirectUrl?: string;
    }, user: any): Promise<{
        checkoutUrl: string;
        reference: string;
    }>;
    createAppointmentCheckout(body: {
        barbershopId: string;
        barberId: string;
        serviceIds: string[];
        scheduledAt: string;
        notes?: string;
    }, user: any): Promise<{
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
}
