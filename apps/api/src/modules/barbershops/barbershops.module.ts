import { Module } from "@nestjs/common";
import { BarbershopsController } from "./barbershops.controller";
import { BarbershopsService } from "./barbershops.service";
import { GeoModule } from "../geo/geo.module";

@Module({
  imports: [GeoModule],
  controllers: [BarbershopsController],
  providers: [BarbershopsService],
  exports: [BarbershopsService],
})
export class BarbershopsModule {}
