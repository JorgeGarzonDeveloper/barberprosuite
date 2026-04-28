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
exports.PaymentsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const payments_service_1 = require("./payments.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    mobileCallback(id, status, appointmentId, res) {
        let deepLink = `barberprosuite://payment-success?status=${status ?? "PENDING"}&ref=${id ?? ""}`;
        if (appointmentId) {
            deepLink += `&appointmentId=${appointmentId}&type=appointment`;
        }
        return res.redirect(302, deepLink);
    }
    getPseBanks() {
        return this.paymentsService.getPseBanks();
    }
    createSubscriptionPayment(subscriptionId, method, params) {
        return this.paymentsService.createSubscriptionPayment(subscriptionId, method, params);
    }
    getHistory(barbershopId, page = 1, limit = 20) {
        return this.paymentsService.getPaymentHistory(barbershopId, +page, +limit);
    }
    handleWompiWebhook(body, signature) {
        return this.paymentsService.handleWebhook(body, signature);
    }
    createCheckoutLink(body, user) {
        return this.paymentsService.createBarberCheckoutLink(body.subscriptionId, user.email, body.planName, body.redirectUrl);
    }
    createAppointmentCheckout(body, user) {
        return this.paymentsService.createAppointmentCheckoutLink(user.id, body);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Get)("mobile-callback"),
    (0, swagger_1.ApiOperation)({ summary: "Callback intermedio Wompi → deep link móvil" }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)("id")),
    __param(1, (0, common_1.Query)("status")),
    __param(2, (0, common_1.Query)("appointmentId")),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "mobileCallback", null);
__decorate([
    (0, common_1.Get)("pse-banks"),
    (0, swagger_1.ApiOperation)({ summary: "Obtener lista de bancos disponibles para PSE" }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "getPseBanks", null);
__decorate([
    (0, common_1.Post)("subscription/:subscriptionId"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Crear pago para suscripción" }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)("subscriptionId")),
    __param(1, (0, common_1.Body)("method")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createSubscriptionPayment", null);
__decorate([
    (0, common_1.Get)("history/:barbershopId"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Historial de pagos de una barbería" }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)("barbershopId")),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Post)("webhook/wompi"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Webhook de Wompi (no requiere auth)" }),
    openapi.ApiResponse({ status: common_1.HttpStatus.OK }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)("x-event-checksum")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "handleWompiWebhook", null);
__decorate([
    (0, common_1.Post)("checkout-link"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Generar link de pago Wompi para suscripción de barbero" }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createCheckoutLink", null);
__decorate([
    (0, common_1.Post)("appointment-checkout"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Crear reserva de cita + link de pago Wompi (uno o más servicios + comisión)" }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createAppointmentCheckout", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)("payments"),
    (0, common_1.Controller)("payments"),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map