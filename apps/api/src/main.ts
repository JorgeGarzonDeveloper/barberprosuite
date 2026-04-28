import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import * as compression from "compression";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "warn", "error", "verbose"],
    cors: {
      origin: process.env.WEB_URL || "http://localhost:3002",
      credentials: true,
    },
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(compression());

  // Global prefix
  app.setGlobalPrefix("api/v1");

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // Global filters & interceptors — orden: AllExceptions primero (más general), Http segundo (más específico)
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor()
  );

  // Swagger docs
  if (configService.get("NODE_ENV") !== "production") {
    const config = new DocumentBuilder()
      .setTitle("BarberProSuite API")
      .setDescription(
        "API completa para la plataforma de gestión de barberías"
      )
      .setVersion("1.0")
      .addBearerAuth()
      .addTag("auth", "Autenticación y autorización")
      .addTag("users", "Gestión de usuarios")
      .addTag("barbershops", "Gestión de barberías")
      .addTag("appointments", "Gestión de citas")
      .addTag("queue", "Cola virtual")
      .addTag("subscriptions", "Planes y suscripciones")
      .addTag("payments", "Pagos y facturación")
      .addTag("notifications", "Notificaciones")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = configService.get<number>("APP_PORT") || 3000;
  await app.listen(port);

  console.log(`\n🚀 BarberProSuite API running on: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`🌍 Environment: ${configService.get("NODE_ENV")}\n`);
}

bootstrap();
