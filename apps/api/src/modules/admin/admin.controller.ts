import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  UseGuards,
  Body,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AdminService } from "./admin.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles("ADMIN")
@Controller("admin")
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get("dashboard")
  @ApiOperation({ summary: "Estadísticas del panel admin" })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get("users")
  @ApiOperation({ summary: "Listar todos los usuarios" })
  getUsers(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("role") role?: string,
    @Query("search") search?: string
  ) {
    return this.adminService.getAllUsers(+page, +limit, role, search);
  }

  @Get("barbershops")
  @ApiOperation({ summary: "Listar todas las barberías" })
  getBarbershops(
    @Query("page") page = 1,
    @Query("limit") limit = 20
  ) {
    return this.adminService.getAllBarbershops(+page, +limit);
  }

  @Post("barbers")
  @ApiOperation({ summary: "Crear barbero desde el admin" })
  createBarber(
    @Body() dto: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      password: string;
    }
  ) {
    return this.adminService.createBarber(dto);
  }

  @Patch("users/:id/status")
  @ApiOperation({ summary: "Cambiar estado de usuario" })
  updateUserStatus(
    @Param("id") userId: string,
    @Body("status") status: string
  ) {
    return this.adminService.updateUserStatus(userId, status);
  }

  @Get("revenue")
  @ApiOperation({ summary: "Ingresos por mes (últimos 6 meses)" })
  getRevenue() {
    return this.adminService.getRevenueByMonth();
  }

  @Get("subscriptions")
  @ApiOperation({ summary: "Listar todas las suscripciones" })
  getSubscriptions(
    @Query("page") page = 1,
    @Query("limit") limit = 20
  ) {
    return this.adminService.getAllSubscriptions(+page, +limit);
  }

  @Post("barbers/:userId/assign/:barbershopId")
  @ApiOperation({ summary: "Asignar barbero a una barbería" })
  assignBarberToBarbershop(
    @Param("userId") userId: string,
    @Param("barbershopId") barbershopId: string
  ) {
    return this.adminService.assignBarberToBarbershop(userId, barbershopId);
  }
}
