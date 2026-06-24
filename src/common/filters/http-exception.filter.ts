import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Catches every exception, logs full details server-side, and returns a safe,
 * consistent error body. Non-HTTP exceptions never leak internals to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawMessage =
      exception instanceof HttpException
        ? (exception.getResponse() as { message?: string | string[] }).message ?? exception.message
        : 'Internal server error';

    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

    // Only server errors (5xx) are logged as errors with a stack. Client errors
    // (401/403/404/etc.) are expected and already captured by the access log,
    // so we don't spam the error stream with them.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`${request.method} ${request.url} -> ${message}`, stack);
    }

    response.status(status).json({
      success: false,
      error: message,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
