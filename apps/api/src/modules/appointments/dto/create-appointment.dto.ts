import { IsString, IsUUID, IsISO8601, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAppointmentDto {
  @ApiProperty()
  @IsUUID()
  barbershopId: string;

  @ApiProperty()
  @IsUUID()
  barberId: string;

  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty({ example: "2025-04-25T10:00:00.000Z" })
  @IsISO8601()
  scheduledAt: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
