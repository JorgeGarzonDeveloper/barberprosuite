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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarbershopsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const barbershops_service_1 = require("./barbershops.service");
const create_barbershop_dto_1 = require("./dto/create-barbershop.dto");
const update_barbershop_dto_1 = require("./dto/update-barbershop.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
let BarbershopsController = class BarbershopsController {
    constructor(barbershopsService) {
        this.barbershopsService = barbershopsService;
    }
    findAll(page = 1, limit = 20, search) {
        return this.barbershopsService.findAll(+page, +limit, search);
    }
    findNearby(lat, lng, radius = "10") {
        return this.barbershopsService.findNearby(parseFloat(lat), parseFloat(lng), parseFloat(radius));
    }
    findOne(id) {
        return this.barbershopsService.findOne(id);
    }
    getQrCode(id) {
        return this.barbershopsService.getQrCode(id);
    }
    create(ownerId, dto) {
        return this.barbershopsService.create(ownerId, dto);
    }
    update(id, ownerId, userRole, dto) {
        return this.barbershopsService.update(id, ownerId, dto, userRole);
    }
    regenerateQr(id, ownerId) {
        return this.barbershopsService.regenerateQr(id, ownerId);
    }
    addReview(id, clientId, rating, comment) {
        return this.barbershopsService.addReview(id, clientId, rating, comment);
    }
};
exports.BarbershopsController = BarbershopsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Listar todas las barberías" }),
    (0, swagger_1.ApiQuery)({ name: "page", required: false }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false }),
    (0, swagger_1.ApiQuery)({ name: "search", required: false }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)("page")),
    __param(1, (0, common_1.Query)("limit")),
    __param(2, (0, common_1.Query)("search")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], BarbershopsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("nearby"),
    (0, swagger_1.ApiOperation)({ summary: "Barberías cercanas (Google Maps)" }),
    (0, swagger_1.ApiQuery)({ name: "lat", required: true }),
    (0, swagger_1.ApiQuery)({ name: "lng", required: true }),
    (0, swagger_1.ApiQuery)({ name: "radius", required: false, description: "Radio en km (default: 10)" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)("lat")),
    __param(1, (0, common_1.Query)("lng")),
    __param(2, (0, common_1.Query)("radius")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], BarbershopsController.prototype, "findNearby", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Obtener barbería por ID" }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BarbershopsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(":id/qr"),
    (0, swagger_1.ApiOperation)({ summary: "Obtener código QR de la barbería" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BarbershopsController.prototype, "getQrCode", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("BARBER", "ADMIN"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Crear nueva barbería" }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_barbershop_dto_1.CreateBarbershopDto]),
    __metadata("design:returntype", void 0)
], BarbershopsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("BARBER", "ADMIN"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Actualizar barbería" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)("id")),
    __param(2, (0, current_user_decorator_1.CurrentUser)("role")),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, update_barbershop_dto_1.UpdateBarbershopDto]),
    __metadata("design:returntype", void 0)
], BarbershopsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(":id/qr/regenerate"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("BARBER", "ADMIN"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Regenerar QR de la barbería" }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BarbershopsController.prototype, "regenerateQr", null);
__decorate([
    (0, common_1.Post)(":id/reviews"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Agregar reseña" }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)("id")),
    __param(2, (0, common_1.Body)("rating")),
    __param(3, (0, common_1.Body)("comment")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, String]),
    __metadata("design:returntype", void 0)
], BarbershopsController.prototype, "addReview", null);
exports.BarbershopsController = BarbershopsController = __decorate([
    (0, swagger_1.ApiTags)("barbershops"),
    (0, common_1.Controller)("barbershops"),
    __metadata("design:paramtypes", [barbershops_service_1.BarbershopsService])
], BarbershopsController);
//# sourceMappingURL=barbershops.controller.js.map