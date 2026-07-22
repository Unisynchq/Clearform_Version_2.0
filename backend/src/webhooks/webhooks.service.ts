import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import {
  buildResponseCreatedPayload,
  webhookMatchesTrigger,
  type WebhookEventName,
  type WebhookPayload,
} from './webhook-payload.util';
import { signWebhookPayload } from './webhook-signature.util';

const BLOCKED_URL_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/0\./,
  /^https?:\/\/\[::1\]/,
  /^https?:\/\/169\.254\./,
  /^https?:\/\/metadata\.google\.internal/i,
];

function isBlockedUrl(url: string): boolean {
  return BLOCKED_URL_PATTERNS.some((p) => p.test(url));
}

@Injectable()
export class WebhooksService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('webhooks') private readonly webhookQueue: Queue,
  ) {}

  async dispatchWebhooks(
    formId: string,
    event: WebhookEventName,
    payload: WebhookPayload,
  ): Promise<void> {
    const webhooks = await this.prisma.webhook.findMany({
      where: { formId, active: true },
    });

    const matching = webhooks.filter((wh) =>
      webhookMatchesTrigger(wh.triggers, event),
    );

    await Promise.all(
      matching.map((wh) =>
        this.webhookQueue.add(
          'dispatch',
          {
            webhookId: wh.id,
            url: wh.url,
            secret: wh.secret ?? undefined,
            payload,
            event,
          },
          { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
        ),
      ),
    );
  }

  async findAll(formId: string, userId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
    });
    if (!form) throw new NotFoundException('Form not found');

    return this.prisma.webhook.findMany({
      where: { formId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        formId: true,
        url: true,
        triggers: true,
        active: true,
        lastDeliveredAt: true,
        lastError: true,
        createdAt: true,
        secret: false,
        deliveries: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            event: true,
            statusCode: true,
            success: true,
            error: true,
            attempt: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async create(
    formId: string,
    userId: string,
    createWebhookDto: CreateWebhookDto,
  ) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
    });
    if (!form) throw new NotFoundException('Form not found');

    if (isBlockedUrl(createWebhookDto.url)) {
      throw new BadRequestException(
        'Webhook URL targets a private/loopback address',
      );
    }

    return this.prisma.webhook.create({
      data: {
        formId,
        url: createWebhookDto.url,
        triggers: createWebhookDto.triggers ?? [],
        secret: createWebhookDto.secret,
        active: createWebhookDto.active ?? true,
      },
      select: {
        id: true,
        formId: true,
        url: true,
        triggers: true,
        active: true,
        lastDeliveredAt: true,
        lastError: true,
        createdAt: true,
      },
    });
  }

  async update(
    formId: string,
    webhookId: string,
    userId: string,
    updateWebhookDto: UpdateWebhookDto,
  ) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
    });
    if (!form) throw new NotFoundException('Form not found');

    const webhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, formId },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');

    if (
      updateWebhookDto.url !== undefined &&
      isBlockedUrl(updateWebhookDto.url)
    ) {
      throw new BadRequestException(
        'Webhook URL targets a private/loopback address',
      );
    }

    const dataToUpdate: {
      url?: string;
      triggers?: string[];
      active?: boolean;
      secret?: string | null;
    } = {};
    if (updateWebhookDto.url !== undefined)
      dataToUpdate.url = updateWebhookDto.url;
    if (updateWebhookDto.triggers !== undefined)
      dataToUpdate.triggers = updateWebhookDto.triggers;
    if (updateWebhookDto.active !== undefined)
      dataToUpdate.active = updateWebhookDto.active;
    if (updateWebhookDto.secret !== undefined)
      dataToUpdate.secret = updateWebhookDto.secret || null;

    return this.prisma.webhook.update({
      where: { id: webhookId },
      data: dataToUpdate,
      select: {
        id: true,
        formId: true,
        url: true,
        triggers: true,
        active: true,
        lastDeliveredAt: true,
        lastError: true,
        createdAt: true,
      },
    });
  }

  async remove(formId: string, webhookId: string, userId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
    });
    if (!form) throw new NotFoundException('Form not found');

    const webhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, formId },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');

    return this.prisma.webhook.delete({
      where: { id: webhookId },
    });
  }

  async testWebhook(
    formId: string,
    webhookId: string,
    userId: string,
  ): Promise<{ success: boolean; statusCode: number; message: string }> {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
    });
    if (!form) throw new NotFoundException('Form not found');

    const webhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, formId },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');

    if (isBlockedUrl(webhook.url)) {
      throw new BadRequestException(
        'Webhook URL targets a private/loopback address',
      );
    }

    const samplePayload = buildResponseCreatedPayload({
      formId,
      responseId: 'test_response_id',
      submittedAt: new Date().toISOString(),
      formTitle: form.title,
      answers: { _sample: true },
      test: true,
    });

    const body = JSON.stringify(samplePayload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Clearform-Event': 'response.created',
    };
    if (webhook.secret) {
      headers['X-Clearform-Signature'] = signWebhookPayload(
        webhook.secret,
        body,
      );
    }

    try {
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10_000),
      });

      const success = res.ok;
      await this.prisma.webhookDelivery.create({
        data: {
          webhookId,
          event: 'response.created',
          statusCode: res.status,
          success,
          error: success ? null : `HTTP ${res.status}`,
          attempt: 1,
        },
      });
      if (success) {
        await this.prisma.webhook.update({
          where: { id: webhookId },
          data: { lastDeliveredAt: new Date(), lastError: null },
        });
      } else {
        await this.prisma.webhook.update({
          where: { id: webhookId },
          data: { lastError: `Test delivery failed: HTTP ${res.status}` },
        });
      }

      return {
        success,
        statusCode: res.status,
        message: success
          ? `Delivered — server responded ${res.status}`
          : `Server responded with ${res.status}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.prisma.webhookDelivery.create({
        data: {
          webhookId,
          event: 'response.created',
          statusCode: null,
          success: false,
          error: message,
          attempt: 1,
        },
      });
      await this.prisma.webhook.update({
        where: { id: webhookId },
        data: { lastError: `Test delivery failed: ${message}` },
      });
      return {
        success: false,
        statusCode: 0,
        message: `Delivery failed: ${message}`,
      };
    }
  }
}
