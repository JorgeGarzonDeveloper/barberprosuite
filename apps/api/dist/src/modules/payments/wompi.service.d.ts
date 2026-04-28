import { ConfigService } from "@nestjs/config";
export declare class WompiService {
    private config;
    private readonly logger;
    private readonly publicKey;
    private readonly privateKey;
    private readonly integrityKey;
    private readonly eventsKey;
    constructor(config: ConfigService);
    createPseTransaction(params: {
        amountInCents: number;
        reference: string;
        email: string;
        bankCode: string;
        documentType: string;
        documentNumber: string;
        redirectUrl: string;
    }): Promise<any>;
    createPaymentLink(params: {
        amountInCents: number;
        reference: string;
        description: string;
        redirectUrl: string;
        expiresAt?: Date;
    }): Promise<any>;
    getPseBanks(): Promise<any>;
    getTransaction(transactionId: string): Promise<any>;
    validateWebhookSignature(transactionId: string, amount: number, currency: string, status: string, timestamp: number, receivedSignature: string): boolean;
    private generateSignature;
}
