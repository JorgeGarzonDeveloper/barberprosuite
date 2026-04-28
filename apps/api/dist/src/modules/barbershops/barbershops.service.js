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
exports.BarbershopsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const geo_service_1 = require("../geo/geo.service");
const QRCode = require("qrcode");
const uuid_1 = require("uuid");
let BarbershopsService = class BarbershopsService {
    constructor(prisma, geo) {
        this.prisma = prisma;
        this.geo = geo;
    }
    async findNearby(latitude, longitude, radiusKm = 10, limit = 20) {
        const bbox = this.geo.getBoundingBox({ lat: latitude, lng: longitude }, radiusKm);
        const shops = await this.prisma.barbershop.findMany({
            where: {
                isActive: true,
                latitude: { gte: bbox.minLat, lte: bbox.maxLat },
                longitude: { gte: bbox.minLng, lte: bbox.maxLng },
            },
            include: {
                services: { where: { isActive: true } },
                _count: { select: { queueEntries: true, appointments: true } },
            },
        });
        const shopsWithDistance = shops
            .map((shop) => ({
            ...shop,
            distanceMeters: this.geo.calculateDistance({ lat: latitude, lng: longitude }, { lat: shop.latitude, lng: shop.longitude }),
        }))
            .filter((s) => s.distanceMeters <= radiusKm * 1000)
            .sort((a, b) => a.distanceMeters - b.distanceMeters)
            .slice(0, limit);
        return shopsWithDistance;
    }
    async findAll(page = 1, limit = 20, search) {
        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { city: { contains: search, mode: "insensitive" } },
                    { address: { contains: search, mode: "insensitive" } },
                ],
            }
            : {};
        const [shops, total] = await Promise.all([
            this.prisma.barbershop.findMany({
                where: { ...where, isActive: true },
                include: { services: { where: { isActive: true } } },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { rating: "desc" },
            }),
            this.prisma.barbershop.count({ where }),
        ]);
        return {
            data: shops,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const shop = await this.prisma.barbershop.findUnique({
            where: { id },
            include: {
                services: { where: { isActive: true } },
                barbers: {
                    where: { isAvailable: true },
                    include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
                },
                reviews: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                    include: {
                        client: { include: { user: { select: { firstName: true, avatarUrl: true } } } },
                    },
                },
            },
        });
        if (!shop)
            throw new common_1.NotFoundException("Barbería no encontrada");
        return shop;
    }
    async create(ownerId, dto) {
        const slug = await this.generateSlug(dto.name);
        const shop = await this.prisma.barbershop.create({
            data: {
                ...dto,
                slug,
                ownerId,
                qrSecret: (0, uuid_1.v4)(),
            },
        });
        return shop;
    }
    async update(id, ownerId, dto, userRole) {
        if (userRole !== "ADMIN") {
            await this.validateOwnership(id, ownerId);
        }
        return this.prisma.barbershop.update({
            where: { id },
            data: dto,
        });
    }
    async getQrCode(barbershopId) {
        const shop = await this.prisma.barbershop.findUnique({
            where: { id: barbershopId },
            select: { id: true, qrSecret: true, name: true },
        });
        if (!shop)
            throw new common_1.NotFoundException("Barbería no encontrada");
        const qrData = JSON.stringify({
            barbershopId: shop.id,
            qrSecret: shop.qrSecret,
            action: "join-queue",
        });
        const qrImage = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: "H",
            width: 400,
            margin: 2,
        });
        return { qrImage, barbershopId: shop.id, barbershopName: shop.name };
    }
    async regenerateQr(barbershopId, ownerId, userRole) {
        if (userRole !== "ADMIN") {
            await this.validateOwnership(barbershopId, ownerId);
        }
        const newSecret = (0, uuid_1.v4)();
        await this.prisma.barbershop.update({
            where: { id: barbershopId },
            data: { qrSecret: newSecret },
        });
        return this.getQrCode(barbershopId);
    }
    async addService(barbershopId, ownerId, serviceData) {
        await this.validateOwnership(barbershopId, ownerId);
        return this.prisma.service.create({
            data: { ...serviceData, barbershopId },
        });
    }
    async addReview(barbershopId, clientId, rating, comment) {
        const review = await this.prisma.review.create({
            data: { barbershopId, clientId, rating, comment },
        });
        const aggregate = await this.prisma.review.aggregate({
            where: { barbershopId },
            _avg: { rating: true },
            _count: true,
        });
        await this.prisma.barbershop.update({
            where: { id: barbershopId },
            data: {
                rating: aggregate._avg.rating || 0,
                totalReviews: aggregate._count,
            },
        });
        return review;
    }
    async validateOwnership(barbershopId, ownerId) {
        const shop = await this.prisma.barbershop.findFirst({
            where: { id: barbershopId, ownerId },
        });
        if (!shop) {
            throw new common_1.ForbiddenException("No tienes permiso para modificar esta barbería");
        }
        return shop;
    }
    async generateSlug(name) {
        const base = name
            .toLowerCase()
            .replace(/[áàä]/g, "a")
            .replace(/[éèë]/g, "e")
            .replace(/[íìï]/g, "i")
            .replace(/[óòö]/g, "o")
            .replace(/[úùü]/g, "u")
            .replace(/ñ/g, "n")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .trim();
        let slug = base;
        let counter = 1;
        while (await this.prisma.barbershop.findUnique({ where: { slug } })) {
            slug = `${base}-${counter}`;
            counter++;
        }
        return slug;
    }
};
exports.BarbershopsService = BarbershopsService;
exports.BarbershopsService = BarbershopsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        geo_service_1.GeoService])
], BarbershopsService);
//# sourceMappingURL=barbershops.service.js.map