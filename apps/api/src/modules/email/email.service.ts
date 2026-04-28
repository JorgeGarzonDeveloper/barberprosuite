import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as sgMail from "@sendgrid/mail";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>("SENDGRID_API_KEY");
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    } else {
      this.logger.warn("SENDGRID_API_KEY no configurada — emails desactivados");
    }
  }

  async sendOtp(email: string, firstName: string, code: string) {
    const apiKey = this.config.get<string>("SENDGRID_API_KEY");
    if (!apiKey) {
      this.logger.warn(`OTP para ${email}: ${code} (email desactivado, sin API key)`);
      return;
    }

    try {
      await sgMail.send({
        to: email,
        from: {
          email: "notificaciones@jorgegarzondeveloper.com",
          name: "BarberProSuite",
        },
        subject: "Tu código de verificación - BarberProSuite",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;color:white;border-radius:16px;overflow:hidden;">
            <div style="background:#c9a227;padding:24px;text-align:center;">
              <h1 style="margin:0;color:#0a0a0f;font-size:22px;">BarberProSuite</h1>
            </div>
            <div style="padding:32px;">
              <h2 style="color:#c9a227;margin-top:0;">Hola, ${firstName} 👋</h2>
              <p style="color:#ffffffaa;font-size:15px;">
                Usa el siguiente código para verificar tu cuenta. Expira en <strong style="color:white;">10 minutos</strong>.
              </p>
              <div style="background:#ffffff10;border:1px solid #c9a22740;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
                <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#c9a227;">${code}</span>
              </div>
              <p style="color:#ffffff50;font-size:12px;text-align:center;">
                Si no solicitaste este código, ignora este mensaje.
              </p>
            </div>
          </div>
        `,
      });
      this.logger.log(`OTP enviado a ${email}`);
    } catch (err) {
      this.logger.error(`Error enviando OTP a ${email}: ${err.message}`);
      throw err;
    }
  }
}
