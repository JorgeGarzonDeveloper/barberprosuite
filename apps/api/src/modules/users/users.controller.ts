import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { UsersService } from "./users.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("profile")
  @ApiOperation({ summary: "Obtener perfil completo" })
  getProfile(@CurrentUser("id") userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch("profile")
  @ApiOperation({ summary: "Actualizar perfil" })
  updateProfile(@CurrentUser("id") userId: string, @Body() body: any) {
    return this.usersService.updateProfile(userId, body);
  }

  @Get("barbers/:barbershopId")
  @ApiOperation({ summary: "Listar barberos de una barbería" })
  getBarbers(@Param("barbershopId") barbershopId: string) {
    return this.usersService.getBarbers(barbershopId);
  }
}
