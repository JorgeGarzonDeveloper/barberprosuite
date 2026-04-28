"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const uuid_1 = require("uuid");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService, config) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.config = config;
    }
    async register(dto) {
        const exists = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: dto.email }, { phone: dto.phone }],
            },
        });
        if (exists) {
            throw new common_1.ConflictException(exists.email === dto.email
                ? "El email ya está registrado"
                : "El teléfono ya está registrado");
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                phone: dto.phone,
                firstName: dto.firstName,
                lastName: dto.lastName,
                passwordHash,
                role: dto.role === "barber" ? "BARBER" : "CLIENT",
            },
        });
        if (user.role === "CLIENT") {
            await this.prisma.clientProfile.create({ data: { userId: user.id } });
        }
        else if (user.role === "BARBER") {
            await this.prisma.barberProfile.create({ data: { userId: user.id } });
        }
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        return { user: this.sanitizeUser(user), ...tokens };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (!user) {
            throw new common_1.UnauthorizedException("Credenciales inválidas");
        }
        if (user.status === "SUSPENDED") {
            throw new common_1.UnauthorizedException("Tu cuenta ha sido suspendida");
        }
        const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException("Credenciales inválidas");
        }
        if (user.status === "PENDING_VERIFICATION") {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { status: "ACTIVE" },
            });
        }
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        return { user: this.sanitizeUser(user), ...tokens };
    }
    async refreshTokens(refreshToken) {
        const stored = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!stored || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException("Refresh token inválido o expirado");
        }
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
        const tokens = await this.generateTokens(stored.user.id, stored.user.email, stored.user.role);
        return tokens;
    }
    async logout(userId, refreshToken) {
        if (refreshToken) {
            await this.prisma.refreshToken.deleteMany({
                where: { userId, token: refreshToken },
            });
        }
        else {
            await this.prisma.refreshToken.deleteMany({ where: { userId } });
        }
    }
    async updateFcmToken(userId, fcmToken) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { fcmToken },
        });
    }
    async generateTokens(userId, email, role) {
        const payload = { sub: userId, email, role };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload),
            (0, uuid_1.v4)(),
        ]);
        const refreshExpiry = new Date();
        refreshExpiry.setDate(refreshExpiry.getDate() + 30);
        await this.prisma.refreshToken.create({
            data: {
                userId,
                token: refreshToken,
                expiresAt: refreshExpiry,
            },
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: 7 * 24 * 60 * 60,
        };
    }
    sanitizeUser(user) {
        const { passwordHash, ...sanitized } = user;
        return sanitized;
    }
    async validateUser(email, password) {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user)
            return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid)
            return null;
        return this.sanitizeUser(user);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map