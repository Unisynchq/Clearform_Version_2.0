import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { ConfigService } from '@nestjs/config';
import type { Response, Request } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const correlationId =
      (request.headers['x-correlation-id'] as string | undefined) ??
      `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message = 'An error occurred';
      let details: unknown = undefined;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) ?? message;
        details = resp.details ?? resp.errors ?? undefined;

        if (Array.isArray(resp.message)) {
          details = resp.message;
          message = 'Validation failed';
        }
      }

      if (status >= 500) {
        this.logger.error(
          `[${correlationId}] ${status} ${request.method} ${request.url}: ${message}`,
          exception instanceof Error ? exception.stack : undefined,
        );
        Sentry.captureException(exception, {
          tags: { correlationId, method: request.method, path: request.url },
          extra: { statusCode: status },
        });
      }

      const sanitizedMessage =
        isProduction && status >= 500 ? 'Internal server error' : message;

      response.status(status).json({
        statusCode: status,
        message: sanitizedMessage,
        ...(details && !isProduction ? { details } : {}),
        ...(correlationId ? { correlationId } : {}),
      });
      return;
    }

    const error =
      exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(
      `[${correlationId}] Unhandled exception ${request.method} ${request.url}: ${error.message}`,
      error.stack,
    );
    Sentry.captureException(error, {
      tags: { correlationId, method: request.method, path: request.url },
    });

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: isProduction ? 'Internal server error' : error.message,
      correlationId,
    });
  }
}
