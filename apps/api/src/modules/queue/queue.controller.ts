import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { QueueService } from "./queue.service";
import { JoinQueueDto } from "./dto/join-queue.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";

@ApiTags("queue")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Controller("queue")
export class QueueController {
  constructor(private queueService: QueueService) {}

  @Get("my-entry")
  @Roles("CLIENT")
  @ApiOperation({ summary: "Obtener la entrada activa del cliente en cualquier fila" })
  getMyEntry(@CurrentUser("id") userId: string) {
    return this.queueService.getMyEntry(userId);
  }

  @Get("barbers/:barbershopId")
  @ApiOperation({ summary: "Barberos disponibles en una barbería para elegir al unirse" })
  getAvailableBarbers(@Param("barbershopId") barbershopId: string) {
    return this.queueService.getAvailableBarbers(barbershopId);
  }

  @Get("my-queue")
  @Roles("BARBER", "ADMIN")
  @ApiOperation({ summary: "Cola actual del barbero autenticado" })
  getBarberQueue(@CurrentUser("id") userId: string) {
    return this.queueService.getBarberQueue(userId);
  }

  @Post("call-next-mine")
  @Roles("BARBER", "ADMIN")
  @ApiOperation({ summary: "Llamar al siguiente cliente de la cola propia" })
  callNextMine(@CurrentUser("id") userId: string) {
    return this.queueService.callNextForBarber(userId);
  }

  @Post("complete-current")
  @Roles("BARBER", "ADMIN")
  @ApiOperation({ summary: "Completar el turno actualmente en curso" })
  completeCurrent(@CurrentUser("id") userId: string) {
    return this.queueService.completeCurrentService(userId);
  }

  @Get("barbershop/:barbershopId")
  @ApiOperation({ summary: "Ver fila virtual de una barbería" })
  getQueue(@Param("barbershopId") barbershopId: string) {
    return this.queueService.getQueue(barbershopId);
  }

  @Post("join")
  @Roles("CLIENT")
  @ApiOperation({ summary: "Unirse a la fila virtual (via QR scan)" })
  joinQueue(
    @CurrentUser("id") clientId: string,
    @Body() dto: JoinQueueDto
  ) {
    return this.queueService.joinQueue(clientId, dto);
  }

  @Patch("location")
  @Roles("CLIENT")
  @ApiOperation({ summary: "Actualizar ubicación del cliente en la fila" })
  updateLocation(
    @CurrentUser("id") clientId: string,
    @Body() dto: UpdateLocationDto
  ) {
    return this.queueService.updateLocation(clientId, dto);
  }

  @Post("call-next/:barbershopId")
  @Roles("BARBER", "ADMIN")
  @ApiOperation({ summary: "Llamar al siguiente cliente en la fila" })
  callNext(
    @Param("barbershopId") barbershopId: string,
    @CurrentUser("id") barberId: string
  ) {
    return this.queueService.callNext(barbershopId, barberId);
  }

  @Patch("complete/:entryId")
  @Roles("BARBER", "ADMIN")
  @ApiOperation({ summary: "Marcar servicio como completado" })
  completeService(
    @Param("entryId") entryId: string,
    @CurrentUser("id") barberId: string,
    @Body("barbershopId") barbershopId: string
  ) {
    return this.queueService.completeService(entryId, barbershopId);
  }

  @Delete("leave/:entryId")
  @Roles("CLIENT")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Abandonar la fila" })
  leaveQueue(
    @CurrentUser("id") clientId: string,
    @Param("entryId") entryId: string
  ) {
    return this.queueService.leaveQueue(clientId, entryId);
  }
}
