import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { BarberService } from "./barber.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";

@ApiTags("barber")
@Controller("barber")
export class BarberController {
  constructor(private barberService: BarberService) {}

  /**
   * Endpoint público: servicios activos de un barbero específico.
   * Lo usan los clientes al reservar una cita. NO requiere auth.
   */
  @Get("services/by-barber/:barberId")
  @ApiOperation({ summary: "Servicios de un barbero (público, para reservas)" })
  getServicesByBarber(@Param("barberId") barberId: string) {
    return this.barberService.getServicesByBarber(barberId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("BARBER", "ADMIN")
  @Get("profile")
  @ApiOperation({ summary: "Mi perfil de barbero + barbería asignada" })
  getMyProfile(@CurrentUser("id") userId: string) {
    return this.barberService.getMyProfile(userId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("BARBER", "ADMIN")
  @Get("stats")
  @ApiOperation({ summary: "Estadísticas básicas del barbero" })
  getMyStats(@CurrentUser("id") userId: string) {
    return this.barberService.getMyStats(userId);
  }

  // ─── Servicios (rutas protegidas del barbero) ────────────────────

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("BARBER", "ADMIN")
  @Get("services")
  @ApiOperation({ summary: "Listar mis servicios" })
  getMyServices(@CurrentUser("id") userId: string) {
    return this.barberService.getMyServices(userId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("BARBER", "ADMIN")
  @Post("services")
  @ApiOperation({ summary: "Crear servicio" })
  createService(
    @CurrentUser("id") userId: string,
    @Body()
    dto: {
      name: string;
      description?: string;
      durationMinutes: number;
      price: number;
    }
  ) {
    return this.barberService.createService(userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("BARBER", "ADMIN")
  @Patch("services/:id")
  @ApiOperation({ summary: "Actualizar servicio" })
  updateService(
    @CurrentUser("id") userId: string,
    @Param("id") serviceId: string,
    @Body()
    dto: {
      name?: string;
      description?: string;
      durationMinutes?: number;
      price?: number;
      isActive?: boolean;
    }
  ) {
    return this.barberService.updateService(userId, serviceId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("BARBER", "ADMIN")
  @Delete("services/:id")
  @ApiOperation({ summary: "Eliminar (desactivar) servicio" })
  deleteService(
    @CurrentUser("id") userId: string,
    @Param("id") serviceId: string
  ) {
    return this.barberService.deleteService(userId, serviceId);
  }

  // ─── Citas ──────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("BARBER", "ADMIN")
  @Get("appointments")
  @ApiOperation({ summary: "Mis citas" })
  getMyAppointments(
    @CurrentUser("id") userId: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20
  ) {
    return this.barberService.getMyAppointments(userId, +page, +limit);
  }
}
