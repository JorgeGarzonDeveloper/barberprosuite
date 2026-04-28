"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const bull_1 = require("@nestjs/bull");
const cache_manager_1 = require("@nestjs/cache-manager");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const barbershops_module_1 = require("./modules/barbershops/barbershops.module");
const appointments_module_1 = require("./modules/appointments/appointments.module");
const queue_module_1 = require("./modules/queue/queue.module");
const subscriptions_module_1 = require("./modules/subscriptions/subscriptions.module");
const payments_module_1 = require("./modules/payments/payments.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const geo_module_1 = require("./modules/geo/geo.module");
const admin_module_1 = require("./modules/admin/admin.module");
const health_module_1 = require("./modules/health/health.module");
const support_module_1 = require("./modules/support/support.module");
const barber_module_1 = require("./modules/barber/barber.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [".env.local", ".env"],
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    throttlers: [
                        {
                            ttl: config.get("THROTTLE_TTL") || 60000,
                            limit: config.get("THROTTLE_LIMIT") || 100,
                        },
                    ],
                }),
            }),
            schedule_1.ScheduleModule.forRoot(),
            bull_1.BullModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    redis: {
                        host: config.get("REDIS_HOST") || "localhost",
                        port: config.get("REDIS_PORT") || 6379,
                        password: config.get("REDIS_PASSWORD") || undefined,
                    },
                    defaultJobOptions: {
                        removeOnComplete: 100,
                        removeOnFail: 50,
                        attempts: 3,
                        backoff: {
                            type: "exponential",
                            delay: 1000,
                        },
                    },
                }),
            }),
            cache_manager_1.CacheModule.registerAsync({
                isGlobal: true,
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    ttl: 60,
                    max: 1000,
                    store: "memory",
                }),
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            barbershops_module_1.BarbershopsModule,
            appointments_module_1.AppointmentsModule,
            queue_module_1.QueueModule,
            subscriptions_module_1.SubscriptionsModule,
            payments_module_1.PaymentsModule,
            notifications_module_1.NotificationsModule,
            geo_module_1.GeoModule,
            admin_module_1.AdminModule,
            health_module_1.HealthModule,
            support_module_1.SupportModule,
            barber_module_1.BarberModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map