import { PartialType } from "@nestjs/swagger";
import { CreateBarbershopDto } from "./create-barbershop.dto";
import { IsOptional, IsBoolean, IsArray } from "class-validator";

export class UpdateBarbershopDto extends PartialType(CreateBarbershopDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  workingHours?: any[];

  @IsOptional()
  logoUrl?: string;

  @IsOptional()
  coverImageUrl?: string;
}
