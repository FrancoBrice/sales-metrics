import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === "string"
        ? exceptionResponse
        : (exceptionResponse as { message?: string }).message || message;
    } else if (exception instanceof Error) {
      if (exception.message.includes("not found")) {
        status = HttpStatus.NOT_FOUND;
        message = exception.message;
        this.logger.warn(`Not found: ${exception.message}`);
      } else {
        message = exception.message;
        this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
    });
  }
}
