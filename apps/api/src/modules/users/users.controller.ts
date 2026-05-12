import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
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

  @Post("me/avatar")
  @ApiOperation({ summary: "Subir foto de perfil (selfie obligatoria al registrarse)" })
  @UseInterceptors(
    FileInterceptor("avatar", {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) {
          cb(new Error("Solo se permiten imágenes"), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    })
  )
  uploadAvatar(
    @CurrentUser("id") userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(userId, file);
  }

  @Get("barbers/:barbershopId")
  @ApiOperation({ summary: "Listar barberos de una barbería" })
  getBarbers(@Param("barbershopId") barbershopId: string) {
    return this.usersService.getBarbers(barbershopId);
  }
}
