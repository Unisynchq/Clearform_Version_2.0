import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RazorpayPaymentEntity,
  RazorpayProvider,
} from '../providers/razorpay.provider';
import { PilotPurchaseService } from '../purchases/pilot-purchase.service';

type WebhookPayload = {
  event: string;
  payload: {
    subscription?: {
      entity: { id: string; status: string; notes?: { userId?: string } };
    };
    payment?: { entity: RazorpayPaymentEntity };
    order?: {
      entity: {
        id: string;
        notes?: Record<string, string>;
      };
    };
    payment_link?: {
      entity: { id: string; payments?: Array<{ payment_id?: string }> };
    };
  };
};

@Injectable()
export class RazorpayWebhookHandler {
  private readonly logger = new Logger(RazorpayWebhookHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly razorpay: RazorpayProvider,
    private readonly pilotPurchases: PilotPurchaseService,
  ) {}

  private async processPaymentCaptured(
    paymentId: string,
    paymentLinkId?: string,
    event?: string,
  ): Promise<void> {
    try {
      const { claimed } = await this.pilotPurchases.processCapturedPayment(
        paymentId,
        paymentLinkId,
      );
      this.logger.log(
        `Pilot purchase recorded for ${paymentId}${event ? ` (${event})` : ''}${claimed ? ' — auto-claimed' : ''}`,
      );
    } catch (err) {
      this.logger.warn(
        `Pilot purchase webhook failed for ${paymentId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async handle(rawBody: Buffer, signature: string) {
    const secret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn(
        'RAZORPAY_WEBHOOK_SECRET not set — skipping verification',
      );
    } else if (
      !this.razorpay.verifyWebhookSignature(rawBody, signature, secret)
    ) {
      throw new BadRequestException('Invalid Razorpay webhook signature');
    }

    const payload = JSON.parse(rawBody.toString()) as WebhookPayload;
    const event = payload.event;

    if (event === 'order.paid') {
      const orderId = payload.payload?.order?.entity?.id;
      const paymentEntity = payload.payload?.payment?.entity;
      if (paymentEntity?.id) {
        await this.processPaymentCaptured(paymentEntity.id, undefined, event);
      } else if (orderId) {
        const payment =
          await this.razorpay.fetchCapturedPaymentForOrder(orderId);
        if (payment?.id) {
          await this.processPaymentCaptured(payment.id, undefined, event);
        } else {
          this.logger.warn(`order.paid ${orderId}: no captured payment yet`);
        }
      }
      return { received: true, event };
    }

    if (event === 'payment.captured' || event === 'payment_link.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const paymentLinkId = payload.payload?.payment_link?.entity?.id;
      if (paymentEntity?.id) {
        await this.processPaymentCaptured(
          paymentEntity.id,
          paymentLinkId,
          event,
        );
      }
      return { received: true, event };
    }

    const entity = payload.payload?.subscription?.entity;
    if (!entity?.id) {
      return { received: true, event };
    }

    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      authenticated: SubscriptionStatus.ACTIVE,
      halted: SubscriptionStatus.PAST_DUE,
      cancelled: SubscriptionStatus.CANCELLED,
      completed: SubscriptionStatus.CANCELLED,
    };

    const status = statusMap[entity.status] ?? SubscriptionStatus.TRIAL;

    await this.prisma.subscription.updateMany({
      where: { razorpaySubId: entity.id },
      data: { status },
    });

    return { received: true, event };
  }
}
