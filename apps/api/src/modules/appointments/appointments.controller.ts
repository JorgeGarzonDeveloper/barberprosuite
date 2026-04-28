import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("appointments")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("appointments")
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Get("slots")
  @ApiOperation({ summary: "Obtener slots disponibles de un barbero" })
  getSlots(
    @Query("barbershopId") barbershopId: string,
    @Query("barberId") barberId: string,
    @Query("date") date: string
  ) {
    return this.appointmentsService.getAvailableSlots(barbershopId, barberId, date);
  }

  @Get("my")
  @ApiOperation({ summary: "Mis citas" })
  getMyAppointments(
    @CurrentUser("id") userId: string,
    @Query("status") status?: string
  ) {
    return this.appointmentsService.getClientAppointments(userId, status);
  }

  @Post()
  @ApiOperation({ summary: "Crear cita" })
  create(
    @CurrentUser("id") clientId: string,
    @Body() dto: CreateAppointmentDto
  ) {
    return this.appointmentsService.create(clientId, dto);
  }

  @Patch(":id/cancel")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Cancelar cita" })
  cancel(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body("reason") reason?: string
  ) {
    return this.appointmentsService.cancel(id, userId, reason);
  }

  @Get("barber")
  @ApiOperation({ summary: "Citas del barbero autenticado" })
  getBarberAppointments(
    @CurrentUser("id") userId: string,
    @Query("status") status?: string
  ) {
    return this.appointmentsService.getBarberAppointments(userId, status);
  }

  @Patch(":id/confirm")
  @ApiOperation({ summary: "Barbero confirma una cita pendiente" })
  confirm(
    @Param("id") id: string,
    @CurrentUser("id") userId: string
  ) {
    return this.appointmentsService.confirmAppointment(id, userId);
  }

  @Patch(":id/complete")
  @ApiOperation({ summary: "Barbero marca una cita como completada" })
  complete(
    @Param("id") id: string,
    @CurrentUser("id") userId: string
  ) {
    return this.appointmentsService.completeAppointment(id, userId);
  }
}
