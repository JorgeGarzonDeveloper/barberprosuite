import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { WompiService } from "./wompi.service";
import { NequiService } from "./nequi.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [ConfigModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, WompiService, NequiService],
  exports: [PaymentsService, NequiService],
})
export class PaymentsModule {}
