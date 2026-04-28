"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const payments_controller_1 = require("./payments.controller");
const payments_service_1 = require("./payments.service");
const wompi_service_1 = require("./wompi.service");
const nequi_service_1 = require("./nequi.service");
const notifications_module_1 = require("../notifications/notifications.module");
let PaymentsModule = class PaymentsModule {
};
exports.PaymentsModule = PaymentsModule;
exports.PaymentsModule = PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, notifications_module_1.NotificationsModule],
        controllers: [payments_controller_1.PaymentsController],
        providers: [payments_service_1.PaymentsService, wompi_service_1.WompiService, nequi_service_1.NequiService],
        exports: [payments_service_1.PaymentsService, nequi_service_1.NequiService],
    })
], PaymentsModule);
//# sourceMappingURL=payments.module.js.map