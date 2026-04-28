export enum PaymentMethod {
  PSE = "pse",
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  BANK_TRANSFER = "bank_transfer",
  CASH = "cash",
  NEQUI = "nequi",
  DAVIPLATA = "daviplata",
}

export enum PaymentStatus {
  PENDING = "pending",
  APPROVED = "approved",
  DECLINED = "declined",
  VOIDED = "voided",
  ERROR = "error",
}

export interface Payment {
  id: string;
  subscriptionId?: string;
  appointmentId?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  referenceId?: string;     // Wompi reference
  transactionId?: string;   // Wompi transaction ID
  receipt?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentDto {
  amount: number;
  currency: string;
  method: PaymentMethod;
  subscriptionId?: string;
  appointmentId?: string;
  redirectUrl?: string;
  // PSE specific
  bankCode?: string;
  documentType?: string;
  documentNumber?: string;
  // Nequi specific
  phoneNumber?: string;
}

export interface WompiTransaction {
  id: string;
  status: string;
  amount_in_cents: number;
  reference: string;
  payment_method_type: string;
  redirect_url?: string;
}
