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

    if (exception instanceof Error) {
      this.logger.error(
        `${request.method} ${request.url} -> ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(`${request.method} ${request.url} -> unknown exception`);
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
