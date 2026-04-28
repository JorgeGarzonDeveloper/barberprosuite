import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  RawBodyRequest,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { PaymentsService } from "./payments.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  /**
   * Callback intermedio para deep link móvil.
   * Wompi redirige aquí (URL HTTP válida) y este endpoint
   * hace un 302 al deep link de la app: barberprosuite://payment-success
   */
  @Get("mobile-callback")
  @ApiOperation({ summary: "Callback intermedio Wompi → deep link móvil" })
  mobileCallback(
    @Query("id") id: string,
    @Query("status") status: string,
    @Query("appointmentId") appointmentId: string,
    @Res() res: Response
  ) {
    let deepLink = `barberprosuite://payment-success?status=${status ?? "PENDING"}&ref=${id ?? ""}`;
    if (appointmentId) {
      deepLink += `&appointmentId=${appointmentId}&type=appointment`;
    }
    return res.redirect(302, deepLink);
  }

  @Get("pse-banks")
  @ApiOperation({ summary: "Obtener lista de bancos disponibles para PSE" })
  getPseBanks() {
    return this.paymentsService.getPseBanks();
  }

  @Post("subscription/:subscriptionId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Crear pago para suscripción" })
  createSubscriptionPayment(
    @Param("subscriptionId") subscriptionId: string,
    @Body("method") method: string,
    @Body() params: any
  ) {
    return this.paymentsService.createSubscriptionPayment(
      subscriptionId,
      method as any,
      params
    );
  }

  @Get("history/:barbershopId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Historial de pagos de una barbería" })
  getHistory(
    @Param("barbershopId") barbershopId: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20
  ) {
    return this.paymentsService.getPaymentHistory(barbershopId, +page, +limit);
  }

  @Post("webhook/wompi")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Webhook de Wompi (no requiere auth)" })
  handleWompiWebhook(
    @Body() body: any,
    @Headers("x-event-checksum") signature: string
  ) {
    return this.paymentsService.handleWebhook(body, signature);
  }

  @Post("checkout-link")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Generar link de pago Wompi para suscripción de barbero" })
  createCheckoutLink(
    @Body() body: { subscriptionId: string; planName: string; redirectUrl?: string },
    @CurrentUser() user: any
  ) {
    return this.paymentsService.createBarberCheckoutLink(
      body.subscriptionId,
      user.email,
      body.planName,
      body.redirectUrl
    );
  }

  @Post("appointment-checkout")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Crear reserva de cita + link de pago Wompi (uno o más servicios + comisión)" })
  createAppointmentCheckout(
    @Body() body: {
      barbershopId: string;
      barberId: string;
      serviceIds: string[];
      scheduledAt: string;
      notes?: string;
    },
    @CurrentUser() user: any
  ) {
    return this.paymentsService.createAppointmentCheckoutLink(user.id, body);
  }

}
