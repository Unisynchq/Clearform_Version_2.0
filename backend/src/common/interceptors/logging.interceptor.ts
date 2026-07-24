import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        const ms = Date.now() - now;
        if (response.statusCode >= 400) {
          this.logger.warn(`${method} ${url} ${response.statusCode} ${ms}ms`);
        } else {
          this.logger.log(`${method} ${url} ${response.statusCode} ${ms}ms`);
        }
      }),
      catchError((error: Error) => {
        const ms = Date.now() - now;
        const status = (error as Error & { status?: number }).status ?? 500;
        this.logger.error(
          `${method} ${url} ${status} ${ms}ms - ${error.message}`,
        );
        return throwError(() => error);
      }),
    );
  }
}
