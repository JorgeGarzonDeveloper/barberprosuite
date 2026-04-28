import { Controller, Get, Post, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { SubscriptionsService } from "./subscriptions.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("subscriptions")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get("plans")
  @ApiOperation({ summary: "Obtener planes disponibles" })
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get("barbershop/:barbershopId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obtener suscripción de una barbería" })
  getSubscription(@Param("barbershopId") barbershopId: string) {
    return this.subscriptionsService.getSubscription(barbershopId);
  }

  @Post("barbershop/:barbershopId/subscribe/:planId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Suscribirse a un plan (por barbería)" })
  subscribe(
    @Param("barbershopId") barbershopId: string,
    @Param("planId") planId: string
  ) {
    return this.subscriptionsService.subscribe(barbershopId, planId);
  }

  @Post("user/subscribe/:planId")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Suscribirse a un plan (barbero, sin barbería asignada aún)" })
  subscribeUser(
    @Param("planId") planId: string,
    @CurrentUser("sub") userId: string
  ) {
    return this.subscriptionsService.subscribeUser(userId, planId);
  }

  @Get("my")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obtener mi suscripción activa" })
  getMySubscription(@CurrentUser("sub") userId: string) {
    return this.subscriptionsService.getUserSubscription(userId);
  }
}
