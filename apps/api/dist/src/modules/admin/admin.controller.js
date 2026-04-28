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
exports.AdminController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const admin_service_1 = require("./admin.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    getDashboard() {
        return this.adminService.getDashboardStats();
    }
    getUsers(page = 1, limit = 20, role, search) {
        return this.adminService.getAllUsers(+page, +limit, role, search);
    }
    getBarbershops(page = 1, limit = 20) {
        return this.adminService.getAllBarbershops(+page, +limit);
    }
    createBarber(dto) {
        return this.adminService.createBarber(dto);
    }
    updateUserStatus(userId, status) {
        return this.adminService.updateUserStatus(userId, status);
    }
    getRevenue() {
        return this.adminService.getRevenueByMonth();
    }
    getSubscriptions(page = 1, limit = 20) {
        return this.adminService.getAllSubscriptions(+page, +limit);
    }
    assignBarberToBarbershop(userId, barbershopId) {
        return this.adminService.assignBarberToBarbershop(userId, barbershopId);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)("dashboard"),
    (0, swagger_1.ApiOperation)({ summary: "Estadísticas del panel admin" }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)("users"),
    (0, swagger_1.ApiOperation)({ summary: "Listar todos los usuarios" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)("page")),
    __param(1, (0, common_1.Query)("limit")),
    __param(2, (0, common_1.Query)("role")),
    __param(3, (0, common_1.Query)("search")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)("barbershops"),
    (0, swagger_1.ApiOperation)({ summary: "Listar todas las barberías" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)("page")),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getBarbershops", null);
__decorate([
    (0, common_1.Post)("barbers"),
    (0, swagger_1.ApiOperation)({ summary: "Crear barbero desde el admin" }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createBarber", null);
__decorate([
    (0, common_1.Patch)("users/:id/status"),
    (0, swagger_1.ApiOperation)({ summary: "Cambiar estado de usuario" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)("status")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Get)("revenue"),
    (0, swagger_1.ApiOperation)({ summary: "Ingresos por mes (últimos 6 meses)" }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getRevenue", null);
__decorate([
    (0, common_1.Get)("subscriptions"),
    (0, swagger_1.ApiOperation)({ summary: "Listar todas las suscripciones" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)("page")),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getSubscriptions", null);
__decorate([
    (0, common_1.Post)("barbers/:userId/assign/:barbershopId"),
    (0, swagger_1.ApiOperation)({ summary: "Asignar barbero a una barbería" }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("userId")),
    __param(1, (0, common_1.Param)("barbershopId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "assignBarberToBarbershop", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)("admin"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)("ADMIN"),
    (0, common_1.Controller)("admin"),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map