import { IsString, IsNumber, IsOptional, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class JoinQueueDto {
  @ApiProperty()
  @IsUUID()
  barbershopId: string;

  @ApiProperty({ description: "Secret del QR de la barbería" })
  @IsString()
  qrSecret: string;

  @ApiProperty({ example: 4.6721 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -74.0447 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ required: false, description: "ID del BarberProfile preferido" })
  @IsOptional()
  @IsUUID()
  preferredBarberId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fcmToken?: string;
}
