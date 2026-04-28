import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import * as crypto from "crypto";

const WOMPI_API_BASE = "https://sandbox.wompi.co/v1"; // Cambia a https://production.wompi.co/v1 en producción

@Injectable()
export class WompiService {
  private readonly logger = new Logger(WompiService.name);
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly integrityKey: string;

  private readonly eventsKey: string;

  constructor(private config: ConfigService) {
    this.publicKey = config.get("WOMPI_PUBLIC_KEY") || "";
    this.privateKey = config.get("WOMPI_PRIVATE_KEY") || "";
    this.integrityKey = config.get("WOMPI_INTEGRITY_KEY") || "";
    this.eventsKey = config.get("WOMPI_EVENTS_KEY") || "";
  }

  /**
   * Crear transacción PSE (Pagos Seguros en Línea - Colombia)
   */
  async createPseTransaction(params: {
    amountInCents: number;
    reference: string;
    email: string;
    bankCode: string;
    documentType: string;
    documentNumber: string;
    redirectUrl: string;
  }) {
    const signature = this.generateSignature(
      params.reference,
      params.amountInCents,
      "COP"
    );

    try {
      const response = await axios.post(
        `${WOMPI_API_BASE}/transactions`,
        {
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
        },
        {
          headers: {
            Authorization: `Bearer ${this.privateKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.data;
    } catch (err) {
      this.logger.error("PSE transaction failed", err.response?.data);
      throw new BadRequestException(
        err.response?.data?.error?.messages?.join(", ") ||
          "Error al procesar el pago PSE"
      );
    }
  }

  /**
   * Crear link de pago (para tarjeta de crédito/débito)
   */
  async createPaymentLink(params: {
    amountInCents: number;
    reference: string;
    description: string;
    redirectUrl: string;
    expiresAt?: Date;
  }) {
    try {
      const response = await axios.post(
        `${WOMPI_API_BASE}/payment_links`,
        {
          name: "Suscripción BarberProSuite",
          description: params.description,
          single_use: true,
          collect_shipping: false,
          amount_in_cents: params.amountInCents,
          currency: "COP",
          redirect_url: params.redirectUrl,
          reference: params.reference,
          expires_at: params.expiresAt?.toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${this.privateKey}` },
        }
      );

      return response.data.data;
    } catch (err) {
      this.logger.error("Payment link creation failed", err.response?.data);
      throw new BadRequestException("Error al crear el link de pago");
    }
  }

  /**
   * Obtener bancos disponibles para PSE
   */
  async getPseBanks() {
    try {
      const response = await axios.get(
        `${WOMPI_API_BASE}/pse/financial_institutions`,
        {
          headers: { Authorization: `Bearer ${this.publicKey}` },
        }
      );
      return response.data.data;
    } catch (err) {
      this.logger.error("Failed to fetch PSE banks", err);
      return [];
    }
  }

  /**
   * Verificar estado de transacción
   */
  async getTransaction(transactionId: string) {
    try {
      const response = await axios.get(
        `${WOMPI_API_BASE}/transactions/${transactionId}`,
        {
          headers: { Authorization: `Bearer ${this.privateKey}` },
        }
      );
      return response.data.data;
    } catch (err) {
      this.logger.error("Failed to get transaction", err);
      return null;
    }
  }

  /**
   * Validar firma del webhook de Wompi
   */
  validateWebhookSignature(
    transactionId: string,
    amount: number,
    currency: string,
    status: string,
    timestamp: number,
    receivedSignature: string
  ): boolean {
    // Wompi usa la "Llave de eventos" (WOMPI_EVENTS_KEY) para firmar webhooks,
    // no la llave de integridad que se usa al crear transacciones.
    const data = `${transactionId}${amount}${currency}${status}${timestamp}${this.eventsKey}`;
    const expected = crypto.createHash("sha256").update(data).digest("hex");
    return expected === receivedSignature;
  }

  /**
   * Generar firma de integridad para transacciones
   */
  private generateSignature(
    reference: string,
    amountInCents: number,
    currency: string
  ): string {
    const data = `${reference}${amountInCents}${currency}${this.integrityKey}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }
}
