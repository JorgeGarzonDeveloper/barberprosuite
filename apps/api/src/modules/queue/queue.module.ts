import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { QueueController } from "./queue.controller";
import { QueueService } from "./queue.service";
import { QueueGateway } from "./queue.gateway";
import { QueueProcessor } from "./queue.processor";
import { NotificationsModule } from "../notifications/notifications.module";
import { GeoModule } from "../geo/geo.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    BullModule.registerQueue({
      name: "virtual-queue",
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 3,
      },
    }),
    NotificationsModule,
    GeoModule,
    AuthModule,
  ],
  controllers: [QueueController],
  providers: [QueueService, QueueGateway, QueueProcessor],
  exports: [QueueService],
})
export class QueueModule {}
