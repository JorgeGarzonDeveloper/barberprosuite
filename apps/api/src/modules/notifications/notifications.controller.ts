import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { NotificationsService } from "./notifications.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Request } from "express";

@ApiTags("notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  // ── VAPID public key (pública, no requiere auth) ─────────────────────────
  @Get("vapid-public-key")
  @ApiOperation({ summary: "Obtener VAPID public key para web push" })
  getVapidPublicKey() {
    return { publicKey: this.notificationsService.getVapidPublicKey() };
  }

  // ── Suscripción web push ─────────────────────────────────────────────────
  @Post("web-push/subscribe")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Guardar suscripción de web push" })
  subscribe(
    @CurrentUser("id") userId: string,
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
    @Req() req: Request
  ) {
    const userAgent = req.headers["user-agent"];
    return this.notificationsService.saveWebPushSubscription(userId, body, userAgent);
  }

  @Delete("web-push/unsubscribe")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Eliminar suscripción de web push" })
  unsubscribe(@Body() body: { endpoint: string }) {
    return this.notificationsService.removeWebPushSubscription(body.endpoint);
  }

  // ── Notificaciones del usuario ───────────────────────────────────────────
  @Get()
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obtener notificaciones del usuario" })
  getNotifications(
    @CurrentUser("id") userId: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20
  ) {
    return this.notificationsService.getUserNotifications(userId, +page, +limit);
  }

  @Patch(":id/read")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Marcar notificación como leída" })
  markAsRead(
    @CurrentUser("id") userId: string,
    @Param("id") notificationId: string
  ) {
    return this.notificationsService.markAsRead(userId, notificationId);
  }

  @Patch("read-all")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Marcar todas las notificaciones como leídas" })
  markAllAsRead(@CurrentUser("id") userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
