"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WompiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WompiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const crypto = require("crypto");
const WOMPI_API_BASE = "https://sandbox.wompi.co/v1";
let WompiService = WompiService_1 = class WompiService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(WompiService_1.name);
        this.publicKey = config.get("WOMPI_PUBLIC_KEY") || "";
        this.privateKey = config.get("WOMPI_PRIVATE_KEY") || "";
        this.integrityKey = config.get("WOMPI_INTEGRITY_KEY") || "";
        this.eventsKey = config.get("WOMPI_EVENTS_KEY") || "";
    }
    async createPseTransaction(params) {
        const signature = this.generateSignature(params.reference, params.amountInCents, "COP");
        try {
            const response = await axios_1.default.post(`${WOMPI_API_BASE}/transactions`, {
                amount_in_cents: params.amountInCents,
                currency: "COP",
                customer_email: params.email,
                reference: params.reference,
                payment_method: {
                    type: "PSE",
                    user_type: 0,
                    user_legal_id_type: params.documentType,
                    user_legal_id: params.documentNumber,
                    financial_institution_code: params.bankCode,
                    payment_description: "Suscripción BarberProSuite",
                },
                redirect_url: params.redirectUrl,
                signature: { integrity: signature },
            }, {
                headers: {
                    Authorization: `Bearer ${this.privateKey}`,
                    "Content-Type": "application/json",
                },
            });
            return response.data.data;
        }
        catch (err) {
            this.logger.error("PSE transaction failed", err.response?.data);
            throw new common_1.BadRequestException(err.response?.data?.error?.messages?.join(", ") ||
                "Error al procesar el pago PSE");
        }
    }
    async createPaymentLink(params) {
        try {
            const response = await axios_1.default.post(`${WOMPI_API_BASE}/payment_links`, {
                name: "Suscripción BarberProSuite",
                description: params.description,
                single_use: true,
                collect_shipping: false,
                amount_in_cents: params.amountInCents,
                currency: "COP",
                redirect_url: params.redirectUrl,
                reference: params.reference,
                expires_at: params.expiresAt?.toISOString(),
            }, {
                headers: { Authorization: `Bearer ${this.privateKey}` },
            });
            return response.data.data;
        }
        catch (err) {
            this.logger.error("Payment link creation failed", err.response?.data);
            throw new common_1.BadRequestException("Error al crear el link de pago");
        }
    }
    async getPseBanks() {
        try {
            const response = await axios_1.default.get(`${WOMPI_API_BASE}/pse/financial_institutions`, {
                headers: { Authorization: `Bearer ${this.publicKey}` },
            });
            return response.data.data;
        }
        catch (err) {
            this.logger.error("Failed to fetch PSE banks", err);
            return [];
        }
    }
    async getTransaction(transactionId) {
        try {
            const response = await axios_1.default.get(`${WOMPI_API_BASE}/transactions/${transactionId}`, {
                headers: { Authorization: `Bearer ${this.privateKey}` },
            });
            return response.data.data;
        }
        catch (err) {
            this.logger.error("Failed to get transaction", err);
            return null;
        }
    }
    validateWebhookSignature(transactionId, amount, currency, status, timestamp, receivedSignature) {
        const data = `${transactionId}${amount}${currency}${status}${timestamp}${this.eventsKey}`;
        const expected = crypto.createHash("sha256").update(data).digest("hex");
        return expected === receivedSignature;
    }
    generateSignature(reference, amountInCents, currency) {
        const data = `${reference}${amountInCents}${currency}${this.integrityKey}`;
        return crypto.createHash("sha256").update(data).digest("hex");
    }
};
exports.WompiService = WompiService;
exports.WompiService = WompiService = WompiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WompiService);
//# sourceMappingURL=wompi.service.js.map