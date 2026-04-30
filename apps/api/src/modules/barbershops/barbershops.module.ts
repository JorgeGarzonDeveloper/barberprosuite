import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { BarbershopsController } from "./barbershops.controller";
import { BarbershopsService } from "./barbershops.service";
import { GeoModule } from "../geo/geo.module";

@Module({
  imports: [GeoModule, MulterModule.register()],
  controllers: [BarbershopsController],
  providers: [BarbershopsService],
  exports: [BarbershopsService],
})
export class BarbershopsModule {}
