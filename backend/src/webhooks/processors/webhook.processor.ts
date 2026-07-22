import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as Sentry from '@sentry/nestjs';
import { PrismaService } from '../../prisma/prisma.service';
import { signWebhookPayload } from '../webhook-signature.util';
import type { WebhookPayload } from '../webhook-payload.util';

const SSRF_BLOCKED = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/0\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/169\.254\./,
  /^https?:\/\/metadata\.google\.internal/i,
  /^https?:\/\/169\.254\.169\.254/,
];

function isSsrfBlocked(url: string): boolean {
  return SSRF_BLOCKED.some((re) => re.test(url));
}

@Processor('webhooks')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { webhookId, url, payload, event, secret } = job.data as {
      webhookId: string;
      url: string;
      payload: WebhookPayload;
      event: string;
      secret?: string;
    };

    const attempt = (job.attemptsMade ?? 0) + 1;
    const formId =
      payload && typeof payload === 'object' && 'formId' in payload
        ? String((payload as { formId: string }).formId)
        : undefined;

    if (isSsrfBlocked(url)) {
      this.logger.warn(`Blocked SSRF attempt to ${url}`);
      await this.recordDelivery(webhookId, event, {
        statusCode: null,
        success: false,
        error: 'Blocked private/loopback URL',
        attempt,
      });
      return;
    }

    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Clearform-Event': event,
    };
    if (secret) {
      headers['X-Clearform-Signature'] = signWebhookPayload(secret, body);
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(30_000),
      });

      if (!res.ok) {
        throw new Error(`Webhook delivery failed: ${res.status} ${url}`);
      }

      await this.recordDelivery(webhookId, event, {
        statusCode: res.status,
        success: true,
        error: null,
        attempt,
      });
      await this.prisma.webhook.update({
        where: { id: webhookId },
        data: { lastDeliveredAt: new Date(), lastError: null },
      });

      this.logger.log(`Delivered ${event} webhook to ${url}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.recordDelivery(webhookId, event, {
        statusCode: null,
        success: false,
        error: message,
        attempt,
      });

      const maxAttempts =
        typeof job.opts.attempts === 'number' ? job.opts.attempts : 1;
      const isFinalAttempt = attempt >= maxAttempts;

      if (isFinalAttempt) {
        await this.prisma.webhook.update({
          where: { id: webhookId },
          data: { lastError: message.slice(0, 500) },
        });
        if (process.env.SENTRY_DSN?.trim()) {
          Sentry.captureException(err, {
            tags: { service: 'clearform-api', subsystem: 'webhooks' },
            extra: { webhookId, formId, event, url, attempt },
          });
        }
      }

      throw err;
    }
  }

  private async recordDelivery(
    webhookId: string,
    event: string,
    result: {
      statusCode: number | null;
      success: boolean;
      error: string | null;
      attempt: number;
    },
  ): Promise<void> {
    await this.prisma.webhookDelivery.create({
      data: {
        webhookId,
        event,
        statusCode: result.statusCode ?? undefined,
        success: result.success,
        error: result.error,
        attempt: result.attempt,
      },
    });
  }
}
