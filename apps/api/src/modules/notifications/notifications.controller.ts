import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { NotificationsService } from "./notifications.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("notifications")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("notifications")
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Obtener notificaciones del usuario" })
  getNotifications(
    @CurrentUser("id") userId: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20
  ) {
    return this.notificationsService.getUserNotifications(userId, +page, +limit);
  }

  @Patch(":id/read")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Marcar notificación como leída" })
  markAsRead(
    @CurrentUser("id") userId: string,
    @Param("id") notificationId: string
  ) {
    return this.notificationsService.markAsRead(userId, notificationId);
  }

  @Patch("read-all")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Marcar todas las notificaciones como leídas" })
  markAllAsRead(@CurrentUser("id") userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
