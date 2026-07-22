import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FormStatus, SubscriptionSource, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { MailService } from '../../notifications/mail.service';
import { FREE_PLAN, PILOT_35_PLAN } from '../../config/plans';
import {
  RazorpayPaymentEntity,
  RazorpayProvider,
} from '../providers/razorpay.provider';
import { BillingStatusResponse } from '../billing.types';
import { enrichBillingStatusForSubscription } from '../billing-status.util';
import { AiEntitlementsService } from '../entitlements/ai-entitlements.service';

@Injectable()
export class PilotPurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly razorpay: RazorpayProvider,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    private readonly aiEntitlements: AiEntitlementsService,
  ) {}

  private pilotDurationDays(): number {
    const raw = this.config.get<string>('PILOT_DURATION_DAYS');
    const parsed = raw ? parseInt(raw, 10) : PILOT_35_PLAN.durationDays;
    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : PILOT_35_PLAN.durationDays;
  }

  private addDays(base: Date, days: number): Date {
    const end = new Date(base);
    end.setDate(end.getDate() + days);
    return end;
  }

  private async countFormsUsed(userId: string): Promise<number> {
    return this.prisma.form.count({
      where: {
        ownerId: userId,
        status: { notIn: [FormStatus.TRASH, FormStatus.ARCHIVED] },
      },
    });
  }

  private async countWorkspacesUsed(userId: string): Promise<number> {
    return this.prisma.workspace.count({ where: { ownerId: userId } });
  }

  async verifyPaymentCaptured(
    paymentId: string,
  ): Promise<RazorpayPaymentEntity> {
    const payment = await this.razorpay.fetchPayment(paymentId);
    if (payment.status !== 'captured') {
      throw new BadRequestException('Payment is not captured');
    }
    return payment;
  }

  /** userId from payment notes, else from linked order notes (platform checkout). */
  async resolveLinkedUserId(
    payment: RazorpayPaymentEntity,
  ): Promise<string | null> {
    const fromPayment = payment.notes?.userId?.trim();
    if (fromPayment) return fromPayment;

    const orderId = payment.order_id?.trim();
    if (!orderId) return null;

    try {
      const order = await this.razorpay.fetchOrder(orderId);
      return order.notes?.userId?.trim() || null;
    } catch {
      return null;
    }
  }

  private async isPlatformCheckoutForUser(
    purchase: { razorpayOrderId: string | null },
    userId: string,
  ): Promise<boolean> {
    const orderId = purchase.razorpayOrderId?.trim();
    if (!orderId) return false;
    try {
      const order = await this.razorpay.fetchOrder(orderId);
      const notes = order.notes ?? {};
      return (
        notes.source === 'platform_checkout' && notes.userId?.trim() === userId
      );
    } catch {
      return false;
    }
  }

  /** Upsert purchase ledger and auto-claim when order/payment notes carry userId. */
  async processCapturedPayment(
    paymentId: string,
    paymentLinkId?: string,
  ): Promise<{ claimed: boolean }> {
    const verified = await this.verifyPaymentCaptured(paymentId);
    await this.upsertPilotPurchaseFromPayment(verified, paymentLinkId);

    const linkedUserId = await this.resolveLinkedUserId(verified);
    if (!linkedUserId) return { claimed: false };

    try {
      await this.claimPurchase(linkedUserId, { paymentId: verified.id });
      return { claimed: true };
    } catch {
      return { claimed: false };
    }
  }

  /** Claim any captured, unexpired purchases matching the user's email. */
  async tryClaimPendingPurchasesForUser(
    userId: string,
  ): Promise<BillingStatusResponse | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) return null;

    const pending = await this.prisma.pilotPurchase.findMany({
      where: {
        userId: null,
        status: 'captured',
        expiresAt: { gt: new Date() },
        email: { equals: user.email, mode: 'insensitive' },
      },
      orderBy: { purchasedAt: 'desc' },
      take: 3,
    });

    for (const purchase of pending) {
      try {
        return await this.claimPurchase(userId, {
          paymentId: purchase.razorpayPaymentId,
        });
      } catch {
        // Try next pending purchase if any.
      }
    }

    const byOrder = await this.prisma.pilotPurchase.findMany({
      where: {
        userId: null,
        status: 'captured',
        expiresAt: { gt: new Date() },
        razorpayOrderId: { not: null },
      },
      orderBy: { purchasedAt: 'desc' },
      take: 5,
    });

    for (const purchase of byOrder) {
      if (await this.isPlatformCheckoutForUser(purchase, userId)) {
        try {
          return await this.claimPurchase(userId, {
            paymentId: purchase.razorpayPaymentId,
          });
        } catch {
          // Continue.
        }
      }
    }

    return null;
  }

  async upsertPilotPurchaseFromPayment(
    payment: RazorpayPaymentEntity,
    paymentLinkId?: string,
  ) {
    if (payment.status !== 'captured') return null;

    const purchasedAt = payment.created_at
      ? new Date(payment.created_at * 1000)
      : new Date();
    const expiresAt = this.addDays(purchasedAt, this.pilotDurationDays());

    return this.prisma.pilotPurchase.upsert({
      where: { razorpayPaymentId: payment.id },
      create: {
        razorpayPaymentId: payment.id,
        razorpayOrderId: payment.order_id ?? null,
        razorpayPaymentLinkId: paymentLinkId ?? null,
        email: payment.email?.toLowerCase() ?? null,
        amountPaise: payment.amount,
        currency: payment.currency,
        status: payment.status,
        planId: PILOT_35_PLAN.id,
        purchasedAt,
        expiresAt,
      },
      update: {
        razorpayOrderId: payment.order_id ?? undefined,
        razorpayPaymentLinkId: paymentLinkId ?? undefined,
        email: payment.email?.toLowerCase() ?? undefined,
        amountPaise: payment.amount,
        currency: payment.currency,
        status: payment.status,
      },
    });
  }

  private buildReceipt(
    purchase: {
      razorpayPaymentId: string;
      purchasedAt: Date;
      amountPaise: number;
      currency: string;
    },
    sub: { razorpayPaymentId: string | null } | null,
  ): BillingStatusResponse['receipt'] {
    return {
      paymentId: purchase.razorpayPaymentId,
      purchasedAt: purchase.purchasedAt,
      amount: purchase.amountPaise / 100,
      currency: purchase.currency,
    };
  }

  private async resolvePaymentId(
    paymentId?: string,
    orderId?: string,
  ): Promise<string> {
    if (paymentId?.trim()) {
      return paymentId.trim();
    }
    if (!orderId?.trim()) {
      throw new BadRequestException('paymentId or orderId is required');
    }

    const normalizedOrderId = orderId.trim();
    const byOrder = await this.prisma.pilotPurchase.findFirst({
      where: { razorpayOrderId: normalizedOrderId },
    });
    if (byOrder?.razorpayPaymentId) {
      return byOrder.razorpayPaymentId;
    }

    const payment =
      await this.razorpay.fetchCapturedPaymentForOrder(normalizedOrderId);
    if (!payment?.id) {
      throw new BadRequestException(
        'No captured payment found for this order. Wait a moment and try again.',
      );
    }
    return payment.id;
  }

  async claimPurchase(
    userId: string,
    options: { paymentId?: string; orderId?: string },
  ): Promise<BillingStatusResponse> {
    const resolvedPaymentId = await this.resolvePaymentId(
      options.paymentId,
      options.orderId,
    );

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let purchase = await this.prisma.pilotPurchase.findUnique({
      where: { razorpayPaymentId: resolvedPaymentId },
    });

    if (!purchase) {
      const verified = await this.verifyPaymentCaptured(resolvedPaymentId);
      purchase = await this.upsertPilotPurchaseFromPayment(verified);
      if (!purchase) {
        throw new BadRequestException('Unable to record payment');
      }
    }

    if (purchase.status !== 'captured') {
      throw new BadRequestException('Payment is not captured');
    }

    if (purchase.expiresAt < new Date()) {
      throw new BadRequestException('Pilot purchase has expired');
    }

    if (purchase.userId && purchase.userId !== userId) {
      throw new BadRequestException('Payment already claimed by another account');
    }

    if (purchase.userId === userId) {
      const existing = await this.prisma.subscription.findUnique({
        where: { userId },
      });
      if (existing) {
        return enrichBillingStatusForSubscription(
          {
            planId: existing.planId,
            status: existing.status,
            responsesUsed: existing.responsesUsed,
            responsesLimit: existing.responsesLimit,
            formsUsed: await this.countFormsUsed(userId),
            formsLimit: PILOT_35_PLAN.formsLimit,
            workspacesUsed: await this.countWorkspacesUsed(userId),
            workspacesLimit: PILOT_35_PLAN.workspacesLimit,
            periodEnd: existing.periodEnd,
            expiresAt: purchase.expiresAt,
            source: existing.source,
            receipt: this.buildReceipt(purchase, existing),
          },
          existing,
          purchase,
        );
      }
    }

    const platformCheckout =
      await this.isPlatformCheckoutForUser(purchase, userId);
    if (
      !platformCheckout &&
      purchase.email &&
      purchase.email.toLowerCase() !== user.email.toLowerCase()
    ) {
      throw new ForbiddenException(
        'Payment email does not match your account email. Sign in with the same email used at checkout or contact support@clearform.in.',
      );
    }

    if (!purchase.userId) {
      purchase = await this.prisma.pilotPurchase.update({
        where: { id: purchase.id },
        data: {
          userId,
          claimedAt: new Date(),
        },
      });
    }

    const periodStart = new Date();
    const periodEnd = this.addDays(periodStart, this.pilotDurationDays());

    const subscription = await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId: PILOT_35_PLAN.id,
        razorpayPaymentId: purchase.razorpayPaymentId,
        status: SubscriptionStatus.ACTIVE,
        responsesLimit: PILOT_35_PLAN.responsesLimit,
        responsesUsed: 0,
        periodStart,
        periodEnd,
        source: SubscriptionSource.RAZORPAY,
      },
      update: {
        planId: PILOT_35_PLAN.id,
        razorpayPaymentId: purchase.razorpayPaymentId,
        status: SubscriptionStatus.ACTIVE,
        responsesLimit: PILOT_35_PLAN.responsesLimit,
        periodStart,
        periodEnd,
        source: SubscriptionSource.RAZORPAY,
      },
    });

    await this.recordPilotActivatedNotification(userId, purchase.razorpayPaymentId);
    await this.sendPilotUpgradeEmail(user, purchase);
    await this.aiEntitlements.resetAiTokenWallet(userId);

    return enrichBillingStatusForSubscription(
      {
        planId: subscription.planId,
        status: subscription.status,
        responsesUsed: subscription.responsesUsed,
        responsesLimit: subscription.responsesLimit,
        formsUsed: await this.countFormsUsed(userId),
        formsLimit: PILOT_35_PLAN.formsLimit,
        workspacesUsed: await this.countWorkspacesUsed(userId),
        workspacesLimit: PILOT_35_PLAN.workspacesLimit,
        periodEnd: subscription.periodEnd,
        expiresAt: purchase.expiresAt,
        source: subscription.source,
        receipt: this.buildReceipt(purchase, subscription),
      },
      subscription,
      purchase,
    );
  }

  private async recordPilotActivatedNotification(
    userId: string,
    paymentId: string,
  ): Promise<void> {
    try {
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId,
          type: 'billing.pilot_activated',
          body: { contains: paymentId },
        },
      });
      if (existing) return;

      await this.notifications.create({
        userId,
        type: 'billing.pilot_activated',
        title: 'Clearform Pilot activated',
        body: `Your pilot plan is active (receipt ${paymentId}). 300 responses · 90 days.`,
      });
    } catch {
      // Non-blocking — billing claim already succeeded.
    }
  }

  private async sendPilotUpgradeEmail(
    user: { id: string; email: string; firstName: string },
    purchase: { razorpayPaymentId: string; expiresAt: Date },
  ): Promise<void> {
    try {
      await this.mail.sendTierUpgradeEmail({
        userId: user.id,
        toEmail: user.email,
        toName: user.firstName || 'there',
        expiresAt: purchase.expiresAt,
        paymentId: purchase.razorpayPaymentId,
      });
    } catch {
      // Non-blocking — billing claim already succeeded.
    }
  }
}
