import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Health check" })
  check() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "BarberProSuite API",
      version: "1.0.0",
    };
  }
}
