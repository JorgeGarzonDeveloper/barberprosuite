import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { BullModule } from "@nestjs/bull";
import { CacheModule } from "@nestjs/cache-manager";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { BarbershopsModule } from "./modules/barbershops/barbershops.module";
import { AppointmentsModule } from "./modules/appointments/appointments.module";
import { QueueModule } from "./modules/queue/queue.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { GeoModule } from "./modules/geo/geo.module";
import { AdminModule } from "./modules/admin/admin.module";
import { HealthModule } from "./modules/health/health.module";
import { SupportModule } from "./modules/support/support.module";
import { BarberModule } from "./modules/barber/barber.module";

@Module({
  imports: [
    // Config global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>("THROTTLE_TTL") || 60000,
            limit: config.get<number>("THROTTLE_LIMIT") || 100,
          },
        ],
      }),
    }),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Queue (Bull + Redis)
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>("REDIS_URL");
        const redisConfig = redisUrl
          ? { url: redisUrl }
          : {
              host: config.get("REDIS_HOST") || "localhost",
              port: config.get<number>("REDIS_PORT") || 6379,
              password: config.get("REDIS_PASSWORD") || undefined,
            };
        return {
          redis: redisConfig,
          defaultJobOptions: {
            removeOnComplete: 100,
            removeOnFail: 50,
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 1000,
            },
          },
        };
      },
    }),

    // Cache (Redis)
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: 60,
        max: 1000,
        store: "memory", // Cambia a redis-store en producción
      }),
    }),

    // Módulos de la aplicación
    PrismaModule,
    AuthModule,
    UsersModule,
    BarbershopsModule,
    AppointmentsModule,
    QueueModule,
    SubscriptionsModule,
    PaymentsModule,
    NotificationsModule,
    GeoModule,
    AdminModule,
    HealthModule,
    SupportModule,
    BarberModule,
  ],
})
export class AppModule {}
