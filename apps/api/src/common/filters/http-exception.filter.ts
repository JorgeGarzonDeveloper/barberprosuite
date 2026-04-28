import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception.getResponse();
    const error =
      typeof exceptionResponse === "string"
        ? exceptionResponse
        : (exceptionResponse as any).message || "Internal server error";

    this.logger.error(
      `${request.method} ${request.url} - ${status}: ${JSON.stringify(error)}`
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      error: Array.isArray(error) ? error : [error],
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
