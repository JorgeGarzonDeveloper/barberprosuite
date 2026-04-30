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
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { BarbershopsService } from "./barbershops.service";
import { CreateBarbershopDto } from "./dto/create-barbershop.dto";
import { UpdateBarbershopDto } from "./dto/update-barbershop.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";

@ApiTags("barbershops")
@Controller("barbershops")
export class BarbershopsController {
  constructor(private barbershopsService: BarbershopsService) {}

  @Get()
  @ApiOperation({ summary: "Listar todas las barberías" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "includeInactive", required: false })
  findAll(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("search") search?: string,
    @Query("includeInactive") includeInactive?: string
  ) {
    return this.barbershopsService.findAll(+page, +limit, search, includeInactive === "true");
  }

  @Get("nearby")
  @ApiOperation({ summary: "Barberías cercanas (Google Maps)" })
  @ApiQuery({ name: "lat", required: true })
  @ApiQuery({ name: "lng", required: true })
  @ApiQuery({ name: "radius", required: false, description: "Radio en km (default: 10)" })
  findNearby(
    @Query("lat") lat: string,
    @Query("lng") lng: string,
    @Query("radius") radius = "10"
  ) {
    return this.barbershopsService.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius)
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener barbería por ID" })
  findOne(@Param("id") id: string) {
    return this.barbershopsService.findOne(id);
  }

  @Get(":id/qr")
  @ApiOperation({ summary: "Obtener código QR de la barbería" })
  getQrCode(@Param("id") id: string) {
    return this.barbershopsService.getQrCode(id);
  }

  @Post()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("BARBER", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Crear nueva barbería" })
  create(
    @CurrentUser("id") ownerId: string,
    @Body() dto: CreateBarbershopDto
  ) {
    return this.barbershopsService.create(ownerId, dto);
  }

  @Patch(":id")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("BARBER", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Actualizar barbería" })
  update(
    @Param("id") id: string,
    @CurrentUser("id") ownerId: string,
    @CurrentUser("role") userRole: string,
    @Body() dto: UpdateBarbershopDto
  ) {
    return this.barbershopsService.update(id, ownerId, dto, userRole);
  }

  @Post(":id/qr/regenerate")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("BARBER", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Regenerar QR de la barbería" })
  regenerateQr(
    @Param("id") id: string,
    @CurrentUser("id") ownerId: string
  ) {
    return this.barbershopsService.regenerateQr(id, ownerId);
  }

  @Get(":id/can-review")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Verificar si el cliente puede calificar esta barbería" })
  canClientReview(
    @Param("id") id: string,
    @CurrentUser("id") userId: string
  ) {
    return this.barbershopsService.canClientReview(id, userId);
  }

  @Post(":id/reviews")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Agregar reseña (solo tras cita COMPLETED)" })
  addReview(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body("rating") rating: number,
    @Body("comment") comment?: string,
    @Body("appointmentId") appointmentId?: string
  ) {
    return this.barbershopsService.addReview(id, userId, rating, comment, appointmentId);
  }

  @Post(":id/images")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("BARBER", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Subir imágenes al carrusel de la barbería (multipart/form-data, campo 'images')" })
  @UseInterceptors(
    FilesInterceptor("images", 10, {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) {
          cb(new Error("Solo se permiten imágenes"), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    })
  )
  async uploadImages(
    @Param("id") id: string,
    @CurrentUser("id") ownerId: string,
    @CurrentUser("role") userRole: string,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    return this.barbershopsService.addImages(id, ownerId, files, userRole);
  }

  @Delete(":id/images")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("BARBER", "ADMIN")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Eliminar imagen del carrusel" })
  removeImage(
    @Param("id") id: string,
    @CurrentUser("id") ownerId: string,
    @CurrentUser("role") userRole: string,
    @Body("imageUrl") imageUrl: string
  ) {
    return this.barbershopsService.removeImage(id, ownerId, imageUrl, userRole);
  }
}
