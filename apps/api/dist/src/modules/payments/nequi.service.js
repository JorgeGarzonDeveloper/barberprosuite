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
var NequiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NequiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let NequiService = NequiService_1 = class NequiService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(NequiService_1.name);
        this.cachedToken = null;
        this.tokenExpiresAt = 0;
    }
    get clientId() {
        return this.config.get("NEQUI_CLIENT_ID") ?? "";
    }
    get clientSecret() {
        return this.config.get("NEQUI_CLIENT_SECRET") ?? "";
    }
    get channel() {
        return this.config.get("NEQUI_CHANNEL") ?? "PNP04-C001";
    }
    get commerceCode() {
        return this.config.get("NEQUI_COMMERCE_CODE") ?? "";
    }
    get baseUrl() {
        return this.config.get("NEQUI_BASE_URL") ?? "https://sandbox.nequi.com.co/payments/v2";
    }
    get authUrl() {
        return this.config.get("NEQUI_AUTH_URL") ?? "https://oauth.sandbox.nequi.com.co/oauth2/token";
    }
    isConfigured() {
        return !!(this.clientId && this.clientSecret && this.commerceCode &&
            !this.clientId.startsWith("your_"));
    }
    async getAccessToken() {
        if (!this.isConfigured()) {
            this.logger.warn("Nequi no configurado — faltan credenciales en .env");
            return null;
        }
        if (this.cachedToken && Date.now() < this.tokenExpiresAt - 60_000) {
            return this.cachedToken;
        }
        try {
            const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
            const response = await axios_1.default.post(this.authUrl, "grant_type=client_credentials", {
                headers: {
                    Authorization: `Basic ${credentials}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                timeout: 10_000,
            });
            const { access_token, expires_in } = response.data;
            this.cachedToken = access_token;
            this.tokenExpiresAt = Date.now() + (expires_in ?? 3600) * 1000;
            this.logger.log("Token Nequi obtenido correctamente");
            return access_token;
        }
        catch (err) {
            this.logger.error(`Error obteniendo token Nequi: ${err.message}`);
            return null;
        }
    }
    async requestPayment(phoneNumber, amountCOP, reference) {
        if (!this.isConfigured()) {
            return { success: false, message: "Nequi no configurado" };
        }
        const token = await this.getAccessToken();
        if (!token) {
            return { success: false, message: "No se pudo autenticar con Nequi" };
        }
        const cleanPhone = phoneNumber.replace(/\D/g, "").replace(/^57/, "");
        const requestDate = new Date().toISOString();
        const messageId = `BPS-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const payload = {
            RequestMessage: {
                RequestHeader: {
                    Channel: this.channel,
                    RequestDate: requestDate,
                    MessageID: messageId,
                    ClientID: this.clientId,
                    Destination: {
                        ServiceName: "PaymentService",
                        ServiceOperation: "unregisteredPayment",
                        ServiceRegion: "C001",
                        ServiceVersion: "1.2.0",
                    },
                },
                RequestBody: {
                    any: {
                        unregisteredPayment: {
                            commerceCode: this.commerceCode,
                            value: String(Math.round(amountCOP)),
                            phoneNumber: cleanPhone,
                            reference,
                        },
                    },
                },
            },
        };
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/-services-paymentservice-unregisteredpayment`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Channel: this.channel,
                    client_id: this.clientId,
                },
                timeout: 15_000,
            });
            const responseMessage = response.data?.ResponseMessage;
            const responseHeader = responseMessage?.ResponseHeader;
            const statusCode = responseHeader?.ResponseCode?.EntityCode;
            this.logger.log(`Nequi payment request: code=${statusCode} ref=${reference}`);
            if (statusCode === "0" || responseHeader?.SystemID === "0000") {
                const transactionId = responseMessage?.ResponseBody?.any?.unregisteredPaymentRS?.transactionId ??
                    messageId;
                return { success: true, transactionId, status: "PENDING" };
            }
            const errorMsg = responseHeader?.ResponseCode?.EntityDescription ?? "Error enviando cobro Nequi";
            return { success: false, message: errorMsg };
        }
        catch (err) {
            const errData = err.response?.data;
            this.logger.error(`Nequi requestPayment error: ${err.message}`, errData);
            return {
                success: false,
                message: err.response?.data?.ResponseMessage?.ResponseHeader?.ResponseCode?.EntityDescription
                    ?? "Error de conexión con Nequi",
            };
        }
    }
    async getPaymentStatus(reference) {
        if (!this.isConfigured()) {
            return { success: false, status: "REJECTED", message: "Nequi no configurado" };
        }
        const token = await this.getAccessToken();
        if (!token) {
            return { success: false, status: "REJECTED", message: "Error de autenticación" };
        }
        const messageId = `BPS-STATUS-${Date.now()}`;
        const payload = {
            RequestMessage: {
                RequestHeader: {
                    Channel: this.channel,
                    RequestDate: new Date().toISOString(),
                    MessageID: messageId,
                    ClientID: this.clientId,
                    Destination: {
                        ServiceName: "PaymentService",
                        ServiceOperation: "getStatusPayment",
                        ServiceRegion: "C001",
                        ServiceVersion: "1.2.0",
                    },
                },
                RequestBody: {
                    any: {
                        getStatusPaymentRQ: {
                            commerceCode: this.commerceCode,
                            reference,
                        },
                    },
                },
            },
        };
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/-services-paymentservice-getstatuspayment`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Channel: this.channel,
                    client_id: this.clientId,
                },
                timeout: 10_000,
            });
            const responseMessage = response.data?.ResponseMessage;
            const statusRS = responseMessage?.ResponseBody?.any?.getStatusPaymentRS;
            const nequiStatus = statusRS?.status ?? "PENDING";
            const transactionId = statusRS?.transactionId;
            this.logger.log(`Nequi status check: ref=${reference} status=${nequiStatus}`);
            const mapped = this.mapNequiStatus(nequiStatus);
            return { success: mapped === "APPROVED", status: mapped, transactionId };
        }
        catch (err) {
            this.logger.error(`Nequi getPaymentStatus error: ${err.message}`);
            return { success: false, status: "PENDING" };
        }
    }
    mapNequiStatus(status) {
        const upper = status.toUpperCase();
        if (upper === "APPROVED" || upper === "SUCCESS" || upper === "EXITOSO")
            return "APPROVED";
        if (upper === "REJECTED" || upper === "DECLINED" || upper === "RECHAZADO")
            return "REJECTED";
        if (upper === "EXPIRED" || upper === "EXPIRADO" || upper === "CANCELLED")
            return "EXPIRED";
        return "PENDING";
    }
};
exports.NequiService = NequiService;
exports.NequiService = NequiService = NequiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NequiService);
//# sourceMappingURL=nequi.service.js.map