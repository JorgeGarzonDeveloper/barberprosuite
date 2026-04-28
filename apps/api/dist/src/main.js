"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const helmet_1 = require("helmet");
const compression = require("compression");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ["log", "warn", "error", "verbose"],
        cors: {
            origin: process.env.WEB_URL || "http://localhost:3002",
            credentials: true,
        },
    });
    const configService = app.get(config_1.ConfigService);
    app.use((0, helmet_1.default)());
    app.use(compression());
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter(), new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(), new transform_interceptor_1.TransformInterceptor());
    if (configService.get("NODE_ENV") !== "production") {
        const config = new swagger_1.DocumentBuilder()
            .setTitle("BarberProSuite API")
            .setDescription("API completa para la plataforma de gestión de barberías")
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
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup("api/docs", app, document, {
            swaggerOptions: { persistAuthorization: true },
        });
    }
    const port = configService.get("APP_PORT") || 3000;
    await app.listen(port);
    console.log(`\n🚀 BarberProSuite API running on: http://localhost:${port}/api/v1`);
    console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
    console.log(`🌍 Environment: ${configService.get("NODE_ENV")}\n`);
}
bootstrap();
//# sourceMappingURL=main.js.map