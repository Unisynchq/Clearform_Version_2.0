import './instrument';
import * as Sentry from '@sentry/nestjs';
import { sentryEnabled } from './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { validateProductionEnv } from './config/validate-production-env';
import * as express from 'express';

async function bootstrap() {
  validateProductionEnv();

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bodyParser: false,
  });

  const expressApp = app.getHttpAdapter().getInstance() as express.Application;

  // 10mb limit for publish payloads (base64 logos); verify preserves rawBody for Stripe/Razorpay/Resend webhooks.
  expressApp.use(
    express.json({
      limit: '10mb',
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  expressApp.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Trust the first proxy hop (Cloudflare) so req.ip reflects the real client IP for rate limiting.
  expressApp.set('trust proxy', 1);

  const allowedOrigins = (
    process.env.CORS_ORIGIN ?? 'http://localhost:5174,http://localhost:5173'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  if (sentryEnabled) {
    Sentry.captureMessage('clearform-api started', 'info');
  } else if (process.env.NODE_ENV === 'production') {
    console.warn(
      'SENTRY_DSN is not set — clearform-api errors will not appear in Sentry. Add DSN from https://clearform.sentry.io (project clearform-api).',
    );
  }
}
bootstrap();
