import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsPhoneNumber,
  IsOptional,
  IsIn,
  Matches,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({ example: "usuario@email.com" })
  @IsEmail({}, { message: "Email inválido" })
  email: string;

  @ApiProperty({ example: "Contraseña123!" })
  @IsString()
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "La contraseña debe tener mayúsculas, minúsculas y números",
  })
  password: string;

  @ApiProperty({ example: "Juan" })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: "Pérez" })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: "+573001234567" })
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: "Número de teléfono inválido" })
  phone: string;

  @ApiProperty({ example: "client", enum: ["client", "barber"] })
  @IsOptional()
  @IsIn(["client", "barber"])
  role?: "client" | "barber";
}
