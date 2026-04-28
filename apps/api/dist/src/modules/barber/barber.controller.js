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
exports.BarberController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const barber_service_1 = require("./barber.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
let BarberController = class BarberController {
    constructor(barberService) {
        this.barberService = barberService;
    }
    getServicesByBarber(barberId) {
        return this.barberService.getServicesByBarber(barberId);
    }
    getMyProfile(userId) {
        return this.barberService.getMyProfile(userId);
    }
    getMyStats(userId) {
        return this.barberService.getMyStats(userId);
    }
    getMyServices(userId) {
        return this.barberService.getMyServices(userId);
    }
    createService(userId, dto) {
        return this.barberService.createService(userId, dto);
    }
    updateService(userId, serviceId, dto) {
        return this.barberService.updateService(userId, serviceId, dto);
    }
    deleteService(userId, serviceId) {
        return this.barberService.deleteService(userId, serviceId);
    }
    getMyAppointments(userId, page = 1, limit = 20) {
        return this.barberService.getMyAppointments(userId, +page, +limit);
    }
};
exports.BarberController = BarberController;
__decorate([
    (0, common_1.Get)("services/by-barber/:barberId"),
    (0, swagger_1.ApiOperation)({ summary: "Servicios de un barbero (público, para reservas)" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("barberId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BarberController.prototype, "getServicesByBarber", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("BARBER", "ADMIN"),
    (0, common_1.Get)("profile"),
    (0, swagger_1.ApiOperation)({ summary: "Mi perfil de barbero + barbería asignada" }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BarberController.prototype, "getMyProfile", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("BARBER", "ADMIN"),
    (0, common_1.Get)("stats"),
    (0, swagger_1.ApiOperation)({ summary: "Estadísticas básicas del barbero" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BarberController.prototype, "getMyStats", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("BARBER", "ADMIN"),
    (0, common_1.Get)("services"),
    (0, swagger_1.ApiOperation)({ summary: "Listar mis servicios" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BarberController.prototype, "getMyServices", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("BARBER", "ADMIN"),
    (0, common_1.Post)("services"),
    (0, swagger_1.ApiOperation)({ summary: "Crear servicio" }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BarberController.prototype, "createService", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("BARBER", "ADMIN"),
    (0, common_1.Patch)("services/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Actualizar servicio" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], BarberController.prototype, "updateService", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("BARBER", "ADMIN"),
    (0, common_1.Delete)("services/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Eliminar (desactivar) servicio" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BarberController.prototype, "deleteService", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("BARBER", "ADMIN"),
    (0, common_1.Get)("appointments"),
    (0, swagger_1.ApiOperation)({ summary: "Mis citas" }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], BarberController.prototype, "getMyAppointments", null);
exports.BarberController = BarberController = __decorate([
    (0, swagger_1.ApiTags)("barber"),
    (0, common_1.Controller)("barber"),
    __metadata("design:paramtypes", [barber_service_1.BarberService])
], BarberController);
//# sourceMappingURL=barber.controller.js.map