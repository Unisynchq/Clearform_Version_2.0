import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailLogService {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdempotency(template: string, idempotencyKey: string) {
    return this.prisma.emailLog.findFirst({
      where: {
        template,
        metadata: {
          path: ['idempotencyKey'],
          equals: idempotencyKey,
        },
      },
    });
  }

  async createQueued(data: {
    userId?: string;
    toEmail: string;
    template: string;
    subject: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.emailLog.create({
      data: {
        userId: data.userId,
        toEmail: data.toEmail,
        template: data.template,
        subject: data.subject,
        status: 'queued',
        metadata: data.metadata,
      },
    });
  }

  async markSent(id: string, resendEmailId: string) {
    return this.prisma.emailLog.update({
      where: { id },
      data: {
        resendEmailId,
        status: 'sent',
        lastEventAt: new Date(),
      },
    });
  }

  async markFailed(id: string, error: string) {
    const existing = await this.prisma.emailLog.findUnique({ where: { id } });
    const metadata = {
      ...(existing?.metadata &&
      typeof existing.metadata === 'object' &&
      !Array.isArray(existing.metadata)
        ? (existing.metadata as Record<string, unknown>)
        : {}),
      error,
    };

    return this.prisma.emailLog.update({
      where: { id },
      data: {
        status: 'failed',
        lastEventAt: new Date(),
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }

  async applyWebhookEvent(opts: {
    resendEmailId: string;
    eventType: string;
    payload: Prisma.InputJsonValue;
  }) {
    const existing = await this.prisma.emailLog.findUnique({
      where: { resendEmailId: opts.resendEmailId },
    });
    if (!existing) return null;

    const status = mapResendEventToStatus(opts.eventType);
    const metadata = {
      ...(existing.metadata &&
      typeof existing.metadata === 'object' &&
      !Array.isArray(existing.metadata)
        ? (existing.metadata as Record<string, unknown>)
        : {}),
      lastWebhook: opts.payload,
    };

    return this.prisma.emailLog.update({
      where: { id: existing.id },
      data: {
        status,
        lastEventAt: new Date(),
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }
}

function mapResendEventToStatus(eventType: string): string {
  switch (eventType) {
    case 'email.sent':
      return 'sent';
    case 'email.delivered':
      return 'delivered';
    case 'email.delivery_delayed':
      return 'delayed';
    case 'email.bounced':
      return 'bounced';
    case 'email.complained':
      return 'complained';
    case 'email.failed':
      return 'failed';
    default:
      return eventType.replace('email.', '');
  }
}
