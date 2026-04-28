import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Optional,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { SupportService } from "./support.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";

@ApiTags("support")
@Controller("support")
export class SupportController {
  constructor(private supportService: SupportService) {}

  /**
   * POST /support/tickets
   * Público — cualquier usuario (auth o no) puede crear un ticket.
   * Si el usuario está autenticado se captura su userId automáticamente.
   */
  @Post("tickets")
  @ApiOperation({ summary: "Crear ticket de soporte" })
  createTicket(
    @Body()
    body: {
      subject?: string;
      message: string;
      email?: string;
      source?: string;
      priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    },
    @Request() req: any
  ) {
    const userId: string | undefined = req.user?.id;
    const email: string | undefined = req.user?.email ?? body.email;

    return this.supportService.createTicket({
      userId,
      email,
      subject: body.subject ?? "Consulta desde chat",
      message: body.message,
      source: body.source ?? "web",
      priority: body.priority,
    });
  }

  /**
   * GET /support/my-tickets
   * Requiere autenticación — el usuario ve sus propios tickets.
   */
  @Get("my-tickets")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Ver mis tickets de soporte" })
  getMyTickets(@Request() req: any) {
    return this.supportService.getMyTickets(req.user.id);
  }

  // ─── Admin endpoints ────────────────────────────────────────

  @Get("admin/tickets")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "[Admin] Listar todos los tickets" })
  getAllTickets(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("status") status?: string
  ) {
    return this.supportService.getAllTickets(+page, +limit, status);
  }

  @Post("admin/tickets/:id/reply")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "[Admin] Responder un ticket" })
  replyTicket(
    @Param("id") ticketId: string,
    @Body("message") message: string
  ) {
    return this.supportService.replyTicket(ticketId, message, true);
  }

  @Patch("admin/tickets/:id/close")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "[Admin] Cerrar un ticket" })
  closeTicket(@Param("id") ticketId: string) {
    return this.supportService.closeTicket(ticketId);
  }
}
