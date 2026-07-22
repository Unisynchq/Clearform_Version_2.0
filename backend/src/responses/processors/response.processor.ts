import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import type { Redis } from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../ai/ai.service';
import { WebhooksService } from '../../webhooks/webhooks.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { MailService } from '../../notifications/mail.service';
import { IntegrationsService } from '../../integrations/integrations.service';
import { buildResponseCreatedPayload } from '../../webhooks/webhook-payload.util';
import {
  buildAnswersFromSnapshot,
  parseSnapshotScreens,
} from '../answer-format.util';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { evictAnalyticsCaches } from '../../common/analytics-cache.util';

@Processor('responses', { drainDelay: 30_000, stalledInterval: 300_000 })
export class ResponseProcessor extends WorkerHost {
  private readonly logger = new Logger(ResponseProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly webhooksService: WebhooksService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
    private readonly integrationsService: IntegrationsService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    super();
  }

  async process(job: Job): Promise<{ responseId: string }> {
    const { responseId, formId, payload, submittedAt } = job.data as {
      responseId: string;
      formId: string;
      payload: Record<string, unknown>;
      submittedAt: string;
    };

    const saved = await this.prisma.formResponse.findUnique({
      where: { id: responseId },
    });
    if (!saved) {
      this.logger.warn(`Response ${responseId} not found for side-effects job`);
      return { responseId };
    }

    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: { owner: true, settings: true },
    });

    const notificationsEnabled = form?.settings?.notificationsEnabled ?? true;

    const snapshot = form?.publishedSnapshot ?? form?.builderSnapshot ?? null;
    const contentScreens = parseSnapshotScreens(snapshot).filter(
      (s) => s.type === 'content' && s.id != null,
    );
    const answersMap =
      (payload.answersByScreenId as Record<string, unknown> | undefined) ?? {};
    const topAnswers = buildAnswersFromSnapshot(contentScreens, answersMap)
      .slice(0, 5)
      .map((pair) => ({ label: pair.label, value: pair.value }));

    const webhookPayload = buildResponseCreatedPayload({
      formId,
      responseId: saved.id,
      submittedAt,
      formTitle: form?.title ?? 'Untitled form',
      answers: payload,
    });

    await Promise.all([
      this.aiService.queueQualityAnalysis(saved.id, payload, formId),
      this.webhooksService.dispatchWebhooks(
        formId,
        'response.created',
        webhookPayload,
      ),
      this.integrationsService.dispatchForResponse(
        formId,
        saved.id,
        submittedAt,
        saved.payload,
      ),
      notificationsEnabled && form
        ? this.notificationsService.create({
            userId: form.ownerId,
            formId,
            responseId: saved.id,
            type: 'new_response',
            title: `New response on "${form.title}"`,
            body: `Someone just completed your form.`,
          })
        : Promise.resolve(),
      notificationsEnabled && form
        ? this.mailService.sendNewResponseNotification({
            toEmail: form.owner.email,
            toName: `${form.owner.firstName} ${form.owner.lastName}`.trim(),
            formTitle: form.title,
            formId,
            responseId: saved.id,
            topAnswers,
          })
        : Promise.resolve(),
    ]);

    // Bust analytics caches so the next overview/performance request returns fresh counts.
    await evictAnalyticsCaches(this.redis, formId);

    this.logger.log(
      `Side effects completed for response ${saved.id} form ${formId}`,
    );
    return { responseId: saved.id };
  }
}
