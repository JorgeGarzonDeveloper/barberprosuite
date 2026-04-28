import { ConfigService } from "@nestjs/config";
export interface NequiPaymentResult {
    success: boolean;
    transactionId?: string;
    status?: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
    message?: string;
}
export declare class NequiService {
    private config;
    private readonly logger;
    private cachedToken;
    private tokenExpiresAt;
    constructor(config: ConfigService);
    private get clientId();
    private get clientSecret();
    private get channel();
    private get commerceCode();
    private get baseUrl();
    private get authUrl();
    private isConfigured;
    getAccessToken(): Promise<string | null>;
    requestPayment(phoneNumber: string, amountCOP: number, reference: string): Promise<NequiPaymentResult>;
    getPaymentStatus(reference: string): Promise<NequiPaymentResult>;
    private mapNequiStatus;
}
