"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const queue_controller_1 = require("./queue.controller");
const queue_service_1 = require("./queue.service");
const queue_gateway_1 = require("./queue.gateway");
const queue_processor_1 = require("./queue.processor");
const notifications_module_1 = require("../notifications/notifications.module");
const geo_module_1 = require("../geo/geo.module");
const auth_module_1 = require("../auth/auth.module");
let QueueModule = class QueueModule {
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bull_1.BullModule.registerQueue({
                name: "virtual-queue",
                defaultJobOptions: {
                    removeOnComplete: 50,
                    removeOnFail: 20,
                    attempts: 3,
                },
            }),
            notifications_module_1.NotificationsModule,
            geo_module_1.GeoModule,
            auth_module_1.AuthModule,
        ],
        controllers: [queue_controller_1.QueueController],
        providers: [queue_service_1.QueueService, queue_gateway_1.QueueGateway, queue_processor_1.QueueProcessor],
        exports: [queue_service_1.QueueService],
    })
], QueueModule);
//# sourceMappingURL=queue.module.js.map