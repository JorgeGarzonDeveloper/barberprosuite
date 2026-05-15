import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Body,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AdminService } from "./admin.service";
import { NotificationsService } from "../notifications/notifications.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles("ADMIN")
@Controller("admin")
export class AdminController {
  constructor(
    private adminService: AdminService,
    private notificationsService: NotificationsService
  ) {}

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

  @Get("revenue/breakdown")
  @ApiOperation({ summary: "Desglose de ingresos de la plataforma" })
  getRevenueBreakdown() {
    return this.adminService.getRevenueBreakdown();
  }

  @Get("refunds")
  @ApiOperation({ summary: "Listar solicitudes de devolución" })
  getRefunds(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("status") status?: string
  ) {
    return this.adminService.getRefundRequests(+page, +limit, status);
  }

  @Post("refunds/:id/process")
  @ApiOperation({ summary: "Aprobar o rechazar solicitud de devolución" })
  processRefund(
    @Param("id") ticketId: string,
    @Body("action") action: "approve" | "reject",
    @Body("adminNote") adminNote?: string
  ) {
    return this.adminService.processRefundRequest(ticketId, action, adminNote);
  }

  @Get("payouts")
  @ApiOperation({ summary: "Cuadre de pagos por barbero con registros" })
  getPayouts(@Query("status") status?: string) {
    return this.adminService.getBarberPayouts(status);
  }

  @Post("payouts/record")
  @ApiOperation({ summary: "Crear registro de pago a barbero" })
  createPayoutRecord(
    @Body() body: { barberId: string; barbershopId?: string; amount: number; notes?: string }
  ) {
    return this.adminService.createPayoutRecord(body);
  }

  @Patch("payouts/record/:id")
  @ApiOperation({ summary: "Actualizar estado de registro de pago" })
  updatePayoutRecord(
    @Param("id") id: string,
    @Body() body: { status?: string; notes?: string; proofUrl?: string }
  ) {
    return this.adminService.updatePayoutRecord(id, body);
  }

  @Post("payouts/record/:id/proof")
  @ApiOperation({ summary: "Subir comprobante de pago" })
  @UseInterceptors(FileInterceptor("proof", { storage: memoryStorage() }))
  async uploadPayoutProof(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.adminService.uploadPayoutProof(id, file);
  }

  @Delete("payouts/record/:id")
  @ApiOperation({ summary: "Eliminar registro de pago" })
  deletePayoutRecord(@Param("id") id: string) {
    return this.adminService.deletePayoutRecord(id);
  }

  @Get("payouts/transactions")
  @ApiOperation({ summary: "Listar transacciones de pagos" })
  getPayoutTransactions(@Query("barbershopId") barbershopId?: string) {
    return this.adminService.getPayoutTransactions(barbershopId);
  }

  @Get("transactions/export")
  @ApiOperation({ summary: "Exportar transacciones (CSV)" })
  exportTransactions() {
    return this.adminService.getTransactionsExport();
  }

  @Post("notifications/send")
  @ApiOperation({ summary: "Enviar notificación push masiva" })
  async sendNotification(
    @Body()
    body: {
      title: string;
      body: string;
      userIds?: string[];
      roles?: string[];
    }
  ) {
    const vapidKey = this.notificationsService.getVapidPublicKey();
    if (!vapidKey) {
      return { sent: false, reason: "VAPID keys not configured in environment" };
    }
    const roles = body.roles ?? ["CLIENT", "BARBER", "ADMIN"];
    await this.notificationsService.sendWebPushByRole(roles, body.title, body.body);
    return { sent: true };
  }
}
