export enum PlanName {
  BASIC = "basic",
  PROFESSIONAL = "professional",
  PREMIUM = "premium",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  PENDING_PAYMENT = "pending_payment",
  TRIAL = "trial",
}

export interface Plan {
  id: string;
  name: PlanName;
  displayName: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxBarbers: number;
  maxAppointmentsPerMonth: number;
  features: string[];
  isActive: boolean;
}

export interface Subscription {
  id: string;
  barbershopId: string;
  planId: string;
  plan: Plan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  renewalDate: Date;
  autoRenew: boolean;
  lastPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}
