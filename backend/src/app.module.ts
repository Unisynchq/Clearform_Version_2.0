import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FirebaseAuthGuard } from './auth/firebase-auth.guard';
import { FirebaseModule } from './firebase/firebase.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { FormsModule } from './forms/forms.module';
import { FormSettingsModule } from './form-settings/form-settings.module';
import { ShareModule } from './share/share.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ResponsesModule } from './responses/responses.module';
import { AiModule } from './ai/ai.module';
import { BillingModule } from './billing/billing.module';
import { HealthModule } from './health/health.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { createBullMqConnection } from './redis/connection.options';
import { CommonModule } from './common/common.module';
import { sentryEnabled } from './instrument';

@Module({
  imports: [
    ...(sentryEnabled ? [SentryModule.forRoot()] : []),
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    RedisModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: createBullMqConnection(
          config.getOrThrow<string>('REDIS_URL'),
        ),
        defaultJobOptions: {
          removeOnComplete: { count: 10 },
          removeOnFail: { count: 10 },
          attempts: 2,
        },
      }),
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 60 },
      { name: 'strict', ttl: 60_000, limit: 10 },
    ]),
    PrismaModule,
    FirebaseModule,
    UsersModule,
    AuthModule,
    WorkspacesModule,
    FormsModule,
    FormSettingsModule,
    ShareModule,
    WebhooksModule,
    AnalyticsModule,
    ResponsesModule,
    AiModule,
    BillingModule,
    HealthModule,
    IntegrationsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ...(sentryEnabled
      ? [{ provide: APP_FILTER, useClass: SentryGlobalFilter }]
      : []),
    { provide: APP_FILTER, useClass: ThrottlerExceptionFilter },
    { provide: APP_GUARD, useClass: FirebaseAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
