import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule, MulterModule.register()],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
