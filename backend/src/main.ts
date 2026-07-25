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

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const helmetPkg: any = 'helmet';
    const helmetModule = await import(helmetPkg);
    const helmetFn = helmetModule.default || helmetModule;
    app.use(helmetFn());
  } catch {
    // helmet optional in local build
  }

  const expressApp = app.getHttpAdapter().getInstance() as express.Application;

  expressApp.use(
    express.json({
      limit: '10mb',
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  expressApp.use(express.urlencoded({ extended: true, limit: '10mb' }));
  expressApp.set('trust proxy', 1);

  const allowedOrigins = (
    process.env.CORS_ORIGIN ?? 'http://localhost:5174,http://localhost:5173'
  )
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

  // Fallbacks to prevent user misconfiguration lockouts
  const knownOrigins = [
    'https://change-cf.vercel.app',
    'https://app.clearform.in',
    'http://localhost:5173',
    'http://localhost:5174',
  ];
  for (const ko of knownOrigins) {
    if (!allowedOrigins.includes(ko)) {
      allowedOrigins.push(ko);
    }
  }

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Correlation-Id',
    ],
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
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

void bootstrap();
