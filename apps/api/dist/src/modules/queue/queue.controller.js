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
exports.QueueController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const queue_service_1 = require("./queue.service");
const join_queue_dto_1 = require("./dto/join-queue.dto");
const update_location_dto_1 = require("./dto/update-location.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const roles_guard_1 = require("../../common/guards/roles.guard");
let QueueController = class QueueController {
    constructor(queueService) {
        this.queueService = queueService;
    }
    getMyEntry(userId) {
        return this.queueService.getMyEntry(userId);
    }
    getAvailableBarbers(barbershopId) {
        return this.queueService.getAvailableBarbers(barbershopId);
    }
    getBarberQueue(userId) {
        return this.queueService.getBarberQueue(userId);
    }
    callNextMine(userId) {
        return this.queueService.callNextForBarber(userId);
    }
    completeCurrent(userId) {
        return this.queueService.completeCurrentService(userId);
    }
    getQueue(barbershopId) {
        return this.queueService.getQueue(barbershopId);
    }
    joinQueue(clientId, dto) {
        return this.queueService.joinQueue(clientId, dto);
    }
    updateLocation(clientId, dto) {
        return this.queueService.updateLocation(clientId, dto);
    }
    callNext(barbershopId, barberId) {
        return this.queueService.callNext(barbershopId, barberId);
    }
    completeService(entryId, barberId, barbershopId) {
        return this.queueService.completeService(entryId, barbershopId);
    }
    leaveQueue(clientId, entryId) {
        return this.queueService.leaveQueue(clientId, entryId);
    }
};
exports.QueueController = QueueController;
__decorate([
    (0, common_1.Get)("my-entry"),
    (0, roles_decorator_1.Roles)("CLIENT"),
    (0, swagger_1.ApiOperation)({ summary: "Obtener la entrada activa del cliente en cualquier fila" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "getMyEntry", null);
__decorate([
    (0, common_1.Get)("barbers/:barbershopId"),
    (0, swagger_1.ApiOperation)({ summary: "Barberos disponibles en una barbería para elegir al unirse" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("barbershopId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "getAvailableBarbers", null);
__decorate([
    (0, common_1.Get)("my-queue"),
    (0, roles_decorator_1.Roles)("BARBER", "ADMIN"),
    (0, swagger_1.ApiOperation)({ summary: "Cola actual del barbero autenticado" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "getBarberQueue", null);
__decorate([
    (0, common_1.Post)("call-next-mine"),
    (0, roles_decorator_1.Roles)("BARBER", "ADMIN"),
    (0, swagger_1.ApiOperation)({ summary: "Llamar al siguiente cliente de la cola propia" }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "callNextMine", null);
__decorate([
    (0, common_1.Post)("complete-current"),
    (0, roles_decorator_1.Roles)("BARBER", "ADMIN"),
    (0, swagger_1.ApiOperation)({ summary: "Completar el turno actualmente en curso" }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "completeCurrent", null);
__decorate([
    (0, common_1.Get)("barbershop/:barbershopId"),
    (0, swagger_1.ApiOperation)({ summary: "Ver fila virtual de una barbería" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("barbershopId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "getQueue", null);
__decorate([
    (0, common_1.Post)("join"),
    (0, roles_decorator_1.Roles)("CLIENT"),
    (0, swagger_1.ApiOperation)({ summary: "Unirse a la fila virtual (via QR scan)" }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, join_queue_dto_1.JoinQueueDto]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "joinQueue", null);
__decorate([
    (0, common_1.Patch)("location"),
    (0, roles_decorator_1.Roles)("CLIENT"),
    (0, swagger_1.ApiOperation)({ summary: "Actualizar ubicación del cliente en la fila" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_location_dto_1.UpdateLocationDto]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.Post)("call-next/:barbershopId"),
    (0, roles_decorator_1.Roles)("BARBER", "ADMIN"),
    (0, swagger_1.ApiOperation)({ summary: "Llamar al siguiente cliente en la fila" }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("barbershopId")),
    __param(1, (0, current_user_decorator_1.CurrentUser)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "callNext", null);
__decorate([
    (0, common_1.Patch)("complete/:entryId"),
    (0, roles_decorator_1.Roles)("BARBER", "ADMIN"),
    (0, swagger_1.ApiOperation)({ summary: "Marcar servicio como completado" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("entryId")),
    __param(1, (0, current_user_decorator_1.CurrentUser)("id")),
    __param(2, (0, common_1.Body)("barbershopId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "completeService", null);
__decorate([
    (0, common_1.Delete)("leave/:entryId"),
    (0, roles_decorator_1.Roles)("CLIENT"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: "Abandonar la fila" }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __param(1, (0, common_1.Param)("entryId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "leaveQueue", null);
exports.QueueController = QueueController = __decorate([
    (0, swagger_1.ApiTags)("queue"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    (0, common_1.Controller)("queue"),
    __metadata("design:paramtypes", [queue_service_1.QueueService])
], QueueController);
//# sourceMappingURL=queue.controller.js.map