import { execSync } from 'node:child_process';
import * as Sentry from '@sentry/nestjs';
import { consoleLoggingIntegration, prismaIntegration } from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN?.trim();
export const sentryEnabled = Boolean(dsn);

function resolveRelease(): string | undefined {
  const fromEnv = process.env.SENTRY_RELEASE?.trim();
  if (fromEnv) return fromEnv;
  try {
    const sha = execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return sha ? `clearform-api@${sha}` : undefined;
  } catch {
    return undefined;
  }
}

if (dsn) {
  const parsed = Number.parseFloat(
    process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1',
  );
  const release = resolveRelease();

  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    ...(release ? { release } : {}),
    tracesSampleRate: Number.isFinite(parsed) ? parsed : 0.1,
    enableLogs: true,
    integrations: [
      prismaIntegration(),
      consoleLoggingIntegration({ levels: ['warn', 'error', 'log'] }),
    ],
    beforeSend(event) {
      event.tags = { ...event.tags, service: 'clearform-api' };
      return event;
    },
  });

  Sentry.logger.info('clearform-api Sentry initialized', {
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: release ?? 'unknown',
  });
}
