import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { SupportController } from "./support.controller";
import { SupportService } from "./support.service";

@Module({
  imports: [MulterModule.register()],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
