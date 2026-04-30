import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyOtpDto, ResendOtpDto } from "./dto/verify-otp.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private email: EmailService
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });

    if (exists) {
      throw new ConflictException(
        exists.email === dto.email
          ? "El email ya está registrado"
          : "El teléfono ya está registrado"
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        role: dto.role === "barber" ? "BARBER" : "CLIENT",
        status: "PENDING_VERIFICATION",
        otpCode,
        otpExpiresAt,
      },
    });

    // Todo usuario tiene perfil de cliente (un barbero también puede pedir citas en otras barberías)
    await this.prisma.clientProfile.create({ data: { userId: user.id } });
    if (user.role === "BARBER") {
      await this.prisma.barberProfile.create({ data: { userId: user.id } });
    }

    this.email.sendOtp(user.email, user.firstName, otpCode)
      .catch(err => this.logger.error(`OTP email failed for ${user.email}: ${err.message}`));

    return {
      requiresVerification: true,
      email: user.email,
      message: "Código de verificación enviado a tu correo",
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) throw new NotFoundException("Usuario no encontrado");

    if (user.emailVerified) {
      throw new BadRequestException("El correo ya está verificado");
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new BadRequestException("No hay código pendiente, solicita uno nuevo");
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestException("El código ha expirado, solicita uno nuevo");
    }

    if (user.otpCode !== dto.code) {
      throw new BadRequestException("Código incorrecto");
    }

    const verified = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        status: "ACTIVE",
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    const tokens = await this.generateTokens(verified.id, verified.email, verified.role);
    return { user: this.sanitizeUser(verified), ...tokens };
  }

  async resendOtp(dto: ResendOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) throw new NotFoundException("Usuario no encontrado");
    if (user.emailVerified) {
      throw new BadRequestException("El correo ya está verificado");
    }

    const otpCode = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpiresAt },
    });

    this.email.sendOtp(user.email, user.firstName, otpCode)
      .catch(err => this.logger.error(`Resend OTP failed for ${user.email}: ${err.message}`));

    return { message: "Código reenviado a tu correo" };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) throw new UnauthorizedException("Credenciales inválidas");

    if (user.status === "SUSPENDED") {
      throw new UnauthorizedException("Tu cuenta ha sido suspendida");
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException("Credenciales inválidas");

    if (!user.emailVerified) {
      // Reenviar OTP si expiró
      const otpCode = this.generateOtp();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { otpCode, otpExpiresAt },
      });
      this.email.sendOtp(user.email, user.firstName, otpCode)
        .catch(err => this.logger.error(`Login OTP resend failed for ${user.email}: ${err.message}`));

      throw new UnauthorizedException(
        JSON.stringify({ requiresVerification: true, email: user.email })
      );
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refreshTokens(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token inválido o expirado");
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    return this.generateTokens(stored.user.id, stored.user.email, stored.user.role);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId, token: refreshToken },
      });
    } else {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
  }

  async updateFcmToken(userId: string, fcmToken: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { fcmToken } });
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      uuidv4(),
    ]);

    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: { userId, token: refreshToken, expiresAt: refreshExpiry },
    });

    return { accessToken, refreshToken, expiresIn: 7 * 24 * 60 * 60 };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, otpCode, otpExpiresAt, ...sanitized } = user;
    return sanitized;
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return this.sanitizeUser(user);
  }
}
