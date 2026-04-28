import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
export declare class SubscriptionsService {
    private prisma;
    private notifications;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    getPlans(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        displayName: string;
        description: string;
        priceMonthly: number;
        priceYearly: number;
        maxBarbers: number;
        maxAppointmentsPerMonth: number;
        features: string[];
        isActive: boolean;
    }[]>;
    getSubscription(barbershopId: string): Promise<{
        plan: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            displayName: string;
            description: string;
            priceMonthly: number;
            priceYearly: number;
            maxBarbers: number;
            maxAppointmentsPerMonth: number;
            features: string[];
            isActive: boolean;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        barbershopId: string | null;
        startDate: Date;
        planId: string;
        endDate: Date;
        renewalDate: Date;
        autoRenew: boolean;
    }>;
    subscribe(barbershopId: string, planId: string): Promise<{
        plan: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            displayName: string;
            description: string;
            priceMonthly: number;
            priceYearly: number;
            maxBarbers: number;
            maxAppointmentsPerMonth: number;
            features: string[];
            isActive: boolean;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        barbershopId: string | null;
        startDate: Date;
        planId: string;
        endDate: Date;
        renewalDate: Date;
        autoRenew: boolean;
    }>;
    subscribeUser(userId: string, planId: string): Promise<{
        plan: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            displayName: string;
            description: string;
            priceMonthly: number;
            priceYearly: number;
            maxBarbers: number;
            maxAppointmentsPerMonth: number;
            features: string[];
            isActive: boolean;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        barbershopId: string | null;
        startDate: Date;
        planId: string;
        endDate: Date;
        renewalDate: Date;
        autoRenew: boolean;
    }>;
    getUserSubscription(userId: string): Promise<{
        plan: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            displayName: string;
            description: string;
            priceMonthly: number;
            priceYearly: number;
            maxBarbers: number;
            maxAppointmentsPerMonth: number;
            features: string[];
            isActive: boolean;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        barbershopId: string | null;
        startDate: Date;
        planId: string;
        endDate: Date;
        renewalDate: Date;
        autoRenew: boolean;
    }>;
    activateSubscription(subscriptionId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        barbershopId: string | null;
        startDate: Date;
        planId: string;
        endDate: Date;
        renewalDate: Date;
        autoRenew: boolean;
    }>;
    checkExpiringSubscriptions(): Promise<void>;
}
