import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

export interface NequiPaymentResult {
  success: boolean;
  transactionId?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  message?: string;
}

/**
 * Servicio de integración con la API de Nequi (Bancolombia).
 *
 * Flujo:
 *  1. getAccessToken() — OAuth2 client_credentials
 *  2. requestPayment()  — Envía push al celular Nequi del cliente
 *  3. getPaymentStatus() — El cliente consulta el estado (polling)
 *
 * Sandbox: developer.nequi.com.co
 * Producción: sustituir NEQUI_BASE_URL y NEQUI_AUTH_URL en .env
 */
@Injectable()
export class NequiService {
  private readonly logger = new Logger(NequiService.name);

  // Cache del token para evitar requests innecesarios
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private config: ConfigService) {}

  private get clientId() {
    return this.config.get<string>("NEQUI_CLIENT_ID") ?? "";
  }
  private get clientSecret() {
    return this.config.get<string>("NEQUI_CLIENT_SECRET") ?? "";
  }
  private get channel() {
    return this.config.get<string>("NEQUI_CHANNEL") ?? "PNP04-C001";
  }
  private get commerceCode() {
    return this.config.get<string>("NEQUI_COMMERCE_CODE") ?? "";
  }
  private get baseUrl() {
    return this.config.get<string>("NEQUI_BASE_URL") ?? "https://sandbox.nequi.com.co/payments/v2";
  }
  private get authUrl() {
    return this.config.get<string>("NEQUI_AUTH_URL") ?? "https://oauth.sandbox.nequi.com.co/oauth2/token";
  }

  private isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret && this.commerceCode &&
      !this.clientId.startsWith("your_"));
  }

  // ─── OAuth2 — obtener token de acceso ────────────────────────────────────
  async getAccessToken(): Promise<string | null> {
    if (!this.isConfigured()) {
      this.logger.warn("Nequi no configurado — faltan credenciales en .env");
      return null;
    }

    // Reusar token si aún es válido (con 60s de margen)
    if (this.cachedToken && Date.now() < this.tokenExpiresAt - 60_000) {
      return this.cachedToken;
    }

    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
      const response = await axios.post(
        this.authUrl,
        "grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 10_000,
        }
      );

      const { access_token, expires_in } = response.data;
      this.cachedToken = access_token;
      this.tokenExpiresAt = Date.now() + (expires_in ?? 3600) * 1000;

      this.logger.log("Token Nequi obtenido correctamente");
      return access_token;
    } catch (err: any) {
      this.logger.error(`Error obteniendo token Nequi: ${err.message}`);
      return null;
    }
  }

  // ─── Enviar push de cobro al número Nequi del cliente ────────────────────
  /**
   * Llama a Nequi para enviar una notificación push al número del cliente.
   * El cliente abre su app Nequi, ve el cobro pendiente y aprueba o rechaza.
   *
   * @param phoneNumber  Número celular del cliente (ej: "3001234567")
   * @param amountCOP    Monto en pesos colombianos (ej: 35000)
   * @param reference    Referencia única del pago (ej: "BPS-APT-abc123-1714250000")
   */
  async requestPayment(
    phoneNumber: string,
    amountCOP: number,
    reference: string
  ): Promise<NequiPaymentResult> {
    if (!this.isConfigured()) {
      return { success: false, message: "Nequi no configurado" };
    }

    const token = await this.getAccessToken();
    if (!token) {
      return { success: false, message: "No se pudo autenticar con Nequi" };
    }

    // Limpiar número: solo dígitos, sin +57
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
      const response = await axios.post(
        `${this.baseUrl}/-services-paymentservice-unregisteredpayment`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            Channel: this.channel,
            client_id: this.clientId,
          },
          timeout: 15_000,
        }
      );

      const responseMessage = response.data?.ResponseMessage;
      const responseHeader = responseMessage?.ResponseHeader;
      const statusCode = responseHeader?.ResponseCode?.EntityCode;

      this.logger.log(`Nequi payment request: code=${statusCode} ref=${reference}`);

      // Código 0 = exitoso (push enviado, esperando aprobación del cliente)
      if (statusCode === "0" || responseHeader?.SystemID === "0000") {
        const transactionId =
          responseMessage?.ResponseBody?.any?.unregisteredPaymentRS?.transactionId ??
          messageId;
        return { success: true, transactionId, status: "PENDING" };
      }

      const errorMsg = responseHeader?.ResponseCode?.EntityDescription ?? "Error enviando cobro Nequi";
      return { success: false, message: errorMsg };
    } catch (err: any) {
      const errData = err.response?.data;
      this.logger.error(`Nequi requestPayment error: ${err.message}`, errData);
      return {
        success: false,
        message: err.response?.data?.ResponseMessage?.ResponseHeader?.ResponseCode?.EntityDescription
          ?? "Error de conexión con Nequi",
      };
    }
  }

  // ─── Consultar estado del pago (polling) ─────────────────────────────────
  /**
   * Consulta el estado actual de un cobro Nequi.
   * Llamar cada 3s desde el móvil hasta que sea APPROVED o REJECTED.
   */
  async getPaymentStatus(reference: string): Promise<NequiPaymentResult> {
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
      const response = await axios.post(
        `${this.baseUrl}/-services-paymentservice-getstatuspayment`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            Channel: this.channel,
            client_id: this.clientId,
          },
          timeout: 10_000,
        }
      );

      const responseMessage = response.data?.ResponseMessage;
      const statusRS = responseMessage?.ResponseBody?.any?.getStatusPaymentRS;
      const nequiStatus: string = statusRS?.status ?? "PENDING";
      const transactionId: string = statusRS?.transactionId;

      this.logger.log(`Nequi status check: ref=${reference} status=${nequiStatus}`);

      // Nequi usa: "PENDING", "APPROVED", "REJECTED", "EXPIRED", "CANCELLED"
      const mapped = this.mapNequiStatus(nequiStatus);
      return { success: mapped === "APPROVED", status: mapped, transactionId };
    } catch (err: any) {
      this.logger.error(`Nequi getPaymentStatus error: ${err.message}`);
      return { success: false, status: "PENDING" };
    }
  }

  private mapNequiStatus(status: string): "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" {
    const upper = status.toUpperCase();
    if (upper === "APPROVED" || upper === "SUCCESS" || upper === "EXITOSO") return "APPROVED";
    if (upper === "REJECTED" || upper === "DECLINED" || upper === "RECHAZADO") return "REJECTED";
    if (upper === "EXPIRED" || upper === "EXPIRADO" || upper === "CANCELLED") return "EXPIRED";
    return "PENDING";
  }
}
