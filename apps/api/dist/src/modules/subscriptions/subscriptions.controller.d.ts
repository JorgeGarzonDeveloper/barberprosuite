import { SubscriptionsService } from "./subscriptions.service";
export declare class SubscriptionsController {
    private subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
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
    subscribeUser(planId: string, userId: string): Promise<{
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
    getMySubscription(userId: string): Promise<{
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
}
