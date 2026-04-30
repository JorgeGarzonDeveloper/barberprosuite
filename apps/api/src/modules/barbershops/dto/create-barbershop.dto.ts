import {
  IsString,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  IsEmail,
  Min,
  Max,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateBarbershopDto {
  @ApiProperty({ example: "Barber Shop Elite" })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: "Calle 72 #10-34" })
  @IsString()
  address: string;

  @ApiProperty({ example: "Bogotá" })
  @IsString()
  city: string;

  @ApiProperty({ example: "Cundinamarca" })
  @IsString()
  state: string;

  @ApiProperty({ example: 4.6721 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: -74.0447 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: "+573001234567", required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}
