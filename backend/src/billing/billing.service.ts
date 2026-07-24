import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FormStatus,
  SubscriptionSource,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FREE_PLAN, getPlan, PILOT_35_PLAN } from '../config/plans';
import {
  effectivePlanId,
  isPilotExpired,
  isPilotSubscriptionActive,
} from './entitlements/plan-entitlement.util';
import { BillingStatusResponse } from './billing.types';
import { enrichBillingStatus } from './billing-status.util';
import { BillingEntitlementsService } from './entitlements/billing-entitlements.service';
import { AiEntitlementsService } from './entitlements/ai-entitlements.service';
import { RazorpayProvider } from './providers/razorpay.provider';
import { PilotPurchaseService } from './purchases/pilot-purchase.service';
import { RazorpayWebhookHandler } from './webhooks/razorpay-webhook.handler';
import { NotificationsService } from '../notifications/notifications.service';

export type { BillingStatusResponse } from './billing.types';

/** Billing meters show grandfathered workspaces at full bar (2/2), not over-cap (2/1). */
function meterWorkspacesLimit(planLimit: number, used: number): number {
  return Math.max(planLimit, used);
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly razorpay: RazorpayProvider,
    private readonly entitlements: BillingEntitlementsService,
    private readonly aiEntitlements: AiEntitlementsService,
    private readonly pilotPurchases: PilotPurchaseService,
    private readonly webhookHandler: RazorpayWebhookHandler,
    private readonly notifications: NotificationsService,
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

  async assertCanCreateForm(
    userId: string,
    workspaceId?: string,
  ): Promise<void> {
    return this.entitlements.assertCanCreateForm(userId, workspaceId);
  }

  async assertCanCreateWorkspace(userId: string): Promise<void> {
    return this.entitlements.assertCanCreateWorkspace(userId);
  }

  async assertCanAcceptResponse(formId: string): Promise<void> {
    return this.entitlements.assertCanAcceptResponse(formId);
  }

  async incrementResponsesUsedForForm(formId: string): Promise<void> {
    return this.entitlements.incrementResponsesUsedForForm(formId);
  }

  async createSubscription(_userId: string) {
    // Pro monthly/yearly — not shipped. See docs/razorpay-subscriptions-roadmap.md
    throw new BadRequestException(
      'Recurring Pro plans are not available yet. Use pilot checkout from Profile → Billing.',
    );
  }

  async createCheckout(_userId: string) {
    const paymentLinkId = this.config.get<string>(
      'RAZORPAY_PAYMENT_LINK_ID_PILOT',
    );
    if (!paymentLinkId) {
      throw new BadRequestException(
        'Payment link is not configured. Set RAZORPAY_PAYMENT_LINK_ID_PILOT.',
      );
    }

    const appUrl =
      this.config.get<string>('APP_URL') ?? 'https://app.clearform.in';

    return {
      planId: PILOT_35_PLAN.id,
      paymentLinkId,
      checkoutUrl: `https://razorpay.com/payment-button/plink/${paymentLinkId}/view`,
      redirectHint: `${appUrl}/?payment_id={payment_id}&payment_link_id={payment_link_id}`,
      message:
        'Complete payment on Razorpay, then return to the app to claim your purchase.',
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    return this.webhookHandler.handle(rawBody, signature);
  }

  async getSubscriptionRecord(userId: string) {
    return this.entitlements.getSubscriptionRecord(userId);
  }

  async findFormOwnerId(formId: string) {
    return this.prisma.form.findUnique({
      where: { id: formId },
      select: { ownerId: true },
    });
  }

  async hasProAiBundle(userId: string): Promise<boolean> {
    return this.entitlements.hasProAiBundle(userId);
  }

  private resolvePlanLimits(planId: string) {
    const plan = getPlan(planId);
    if (plan) return plan;
    return FREE_PLAN;
  }

  private buildReceipt(
    purchase: {
      razorpayPaymentId: string;
      purchasedAt: Date;
      amountPaise: number;
      currency: string;
    } | null,
    sub: { razorpayPaymentId: string | null } | null,
  ): BillingStatusResponse['receipt'] | undefined {
    if (purchase) {
      return {
        paymentId: purchase.razorpayPaymentId,
        purchasedAt: purchase.purchasedAt,
        amount: purchase.amountPaise / 100,
        currency: purchase.currency,
      };
    }
    if (sub?.razorpayPaymentId) {
      return {
        paymentId: sub.razorpayPaymentId,
        purchasedAt: new Date(),
        amount: PILOT_35_PLAN.priceUsd,
        currency: 'USD',
      };
    }
    return undefined;
  }

  async getStatus(userId: string): Promise<BillingStatusResponse> {
    const status = await this.buildStatus(userId);
    const aiCredits = await this.aiEntitlements.getAiCreditUsage(userId);

    if (status.periodEnd) {
      const daysUntilExpiry = Math.ceil(
        (new Date(status.periodEnd).getTime() - Date.now()) / 86_400_000,
      );
      if (daysUntilExpiry > 0 && daysUntilExpiry <= 7) {
        this.sendPlanExpiryNotification(userId, daysUntilExpiry).catch(
          () => {},
        );
      }
    }

    return {
      ...status,
      aiCredits,
      aiTokens: aiCredits,
      entitlements: await this.buildEntitlementsDto(userId, status),
    };
  }

  private async sendPlanExpiryNotification(
    userId: string,
    daysUntilExpiry: number,
  ): Promise<void> {
    const existing = await this.prisma.notification.findFirst({
      where: {
        userId,
        type: 'billing_expiring',
        readAt: null,
        createdAt: { gte: new Date(Date.now() - 86_400_000) },
      },
    });
    if (existing) return;

    await this.notifications.create({
      userId,
      type: 'billing_expiring',
      title: 'Subscription expiring',
      body: `Your subscription expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}. Manage your current plan.`,
      action: { routeKey: 'billing', label: 'Manage plan' },
    });
  }

  /**
   * Team-facing plan counts. Fail closed when PLATFORM_STATS_EMAILS is empty
   * or the caller email is not on the allowlist.
   */
  async getPlatformPlanStats(callerEmail: string): Promise<{
    freeUsers: number;
    paidPilotUsers: number;
    trialUsers: number;
  }> {
    const allowlist = (this.config.get<string>('PLATFORM_STATS_EMAILS') ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);

    const email = callerEmail.trim().toLowerCase();
    if (allowlist.length === 0 || !email || !allowlist.includes(email)) {
      throw new ForbiddenException('Platform stats are not available.');
    }

    const now = new Date();
    const [paidPilotUsers, trialUsers, usersWithActivePilot, totalUsers] =
      await Promise.all([
        this.prisma.subscription.count({
          where: {
            planId: PILOT_35_PLAN.id,
            source: SubscriptionSource.RAZORPAY,
            status: {
              in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL],
            },
            periodEnd: { gt: now },
          },
        }),
        this.prisma.subscription.count({
          where: {
            planId: PILOT_35_PLAN.id,
            source: SubscriptionSource.PROMO,
            status: {
              in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL],
            },
            periodEnd: { gt: now },
          },
        }),
        this.prisma.subscription.count({
          where: {
            planId: PILOT_35_PLAN.id,
            status: {
              in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL],
            },
            periodEnd: { gt: now },
          },
        }),
        this.prisma.user.count(),
      ]);

    return {
      freeUsers: Math.max(0, totalUsers - usersWithActivePilot),
      paidPilotUsers,
      trialUsers,
    };
  }

  private async buildEntitlementsDto(
    userId: string,
    status: BillingStatusResponse,
  ): Promise<NonNullable<BillingStatusResponse['entitlements']>> {
    const plan = status.aiTier === 'pro' ? PILOT_35_PLAN : FREE_PLAN;
    const workspaces = await this.entitlements.getWorkspaceEntitlement(userId);
    // AI trial counters are maintained by AiEntitlementsService; until a
    // usage row exists for a user the counts are zero.
    const usage = await this.prisma.aiUsage
      .findUnique({ where: { userId } })
      .catch(() => null);
    return {
      workspaces,
      aiTrial: {
        logic: {
          used: usage?.logicGenerationsUsed ?? 0,
          limit: plan.ai.logicGenerationsTotal,
        },
        qualitySessions: {
          used: usage?.qualitySessionsUsed ?? 0,
          limit: plan.ai.qualityTrialSessions,
        },
      },
    };
  }

  private async buildStatus(userId: string): Promise<BillingStatusResponse> {
    const pilotActiveBefore = await this.entitlements.hasProAiBundle(userId);
    if (!pilotActiveBefore) {
      try {
        const claimed =
          await this.pilotPurchases.tryClaimPendingPurchasesForUser(userId);
        if (claimed) {
          return claimed;
        }
      } catch {
        // Non-blocking — return normal status below.
      }
    }

    const [sub, purchase, formsUsed, workspacesUsed] = await Promise.all([
      this.getSubscriptionRecord(userId),
      this.prisma.pilotPurchase.findUnique({ where: { userId } }),
      this.prisma.form.count({
        where: {
          ownerId: userId,
          status: { notIn: [FormStatus.TRASH, FormStatus.ARCHIVED] },
        },
      }),
      this.prisma.workspace.count({ where: { ownerId: userId } }),
    ]);

    if (!sub) {
      return enrichBillingStatus(
        {
          planId: FREE_PLAN.id,
          status: 'FREE',
          responsesUsed: 0,
          responsesLimit: FREE_PLAN.responsesLimit,
          formsUsed,
          formsLimit: FREE_PLAN.formsLimit,
          workspacesUsed,
          workspacesLimit: meterWorkspacesLimit(
            FREE_PLAN.workspacesLimit,
            workspacesUsed,
          ),
          periodEnd: null,
          expiresAt: purchase?.expiresAt ?? null,
          source: null,
          ...(purchase ? { receipt: this.buildReceipt(purchase, null) } : {}),
        },
        { effectivePlanId: FREE_PLAN.id, pilotActive: false },
      );
    }

    const pilotActive = isPilotSubscriptionActive(sub, purchase);
    const pilotExpired = isPilotExpired(sub, purchase);
    const effectiveId = effectivePlanId(sub, purchase);
    const limits = this.resolvePlanLimits(effectiveId);

    if (pilotExpired && sub.planId === PILOT_35_PLAN.id) {
      return enrichBillingStatus(
        {
          planId: FREE_PLAN.id,
          status: 'EXPIRED',
          responsesUsed: sub.responsesUsed,
          responsesLimit: FREE_PLAN.responsesLimit,
          formsUsed,
          formsLimit: limits.formsLimit,
          workspacesUsed,
          workspacesLimit: meterWorkspacesLimit(
            limits.workspacesLimit,
            workspacesUsed,
          ),
          periodEnd: sub.periodEnd,
          expiresAt: purchase?.expiresAt ?? sub.periodEnd,
          source: sub.source,
          receipt: purchase ? this.buildReceipt(purchase, sub) : undefined,
        },
        { effectivePlanId: FREE_PLAN.id, pilotActive: false },
      );
    }

    if (!pilotActive && sub.planId === PILOT_35_PLAN.id) {
      return enrichBillingStatus(
        {
          planId: FREE_PLAN.id,
          status: sub.status,
          responsesUsed: sub.responsesUsed,
          responsesLimit: FREE_PLAN.responsesLimit,
          formsUsed,
          formsLimit: limits.formsLimit,
          workspacesUsed,
          workspacesLimit: meterWorkspacesLimit(
            limits.workspacesLimit,
            workspacesUsed,
          ),
          periodEnd: sub.periodEnd,
          expiresAt: purchase?.expiresAt ?? sub.periodEnd,
          source: sub.source,
          receipt: purchase ? this.buildReceipt(purchase, sub) : undefined,
        },
        { effectivePlanId: FREE_PLAN.id, pilotActive: false },
      );
    }

    const activeLimits = this.resolvePlanLimits(sub.planId);

    return enrichBillingStatus(
      {
        planId: sub.planId,
        status: sub.status,
        responsesUsed: sub.responsesUsed,
        responsesLimit: sub.responsesLimit,
        formsUsed,
        formsLimit: activeLimits.formsLimit,
        workspacesUsed,
        workspacesLimit: meterWorkspacesLimit(
          activeLimits.workspacesLimit,
          workspacesUsed,
        ),
        periodEnd: sub.periodEnd,
        expiresAt: purchase?.expiresAt ?? sub.periodEnd,
        source: sub.source,
        receipt: this.buildReceipt(purchase, sub),
      },
      { effectivePlanId: sub.planId, pilotActive: pilotActive },
    );
  }

  async claimPurchase(
    userId: string,
    options: { paymentId?: string; orderId?: string },
  ) {
    return this.pilotPurchases.claimPurchase(userId, options);
  }

  async confirmPaymentLinkReturn(userId: string) {
    const allowWithoutWebhook =
      this.config.get<string>('BILLING_ALLOW_PAYMENT_LINK_CONFIRM') === 'true';
    if (!allowWithoutWebhook) {
      throw new BadRequestException(
        'Payment confirmation requires webhook setup. Set BILLING_ALLOW_PAYMENT_LINK_CONFIRM=true for pilot dev only.',
      );
    }

    const periodStart = new Date();
    const periodEnd = this.addDays(periodStart, this.pilotDurationDays());

    const subscription = await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId: PILOT_35_PLAN.id,
        status: SubscriptionStatus.ACTIVE,
        responsesLimit: PILOT_35_PLAN.responsesLimit,
        responsesUsed: 0,
        periodStart,
        periodEnd,
        source: SubscriptionSource.RAZORPAY,
      },
      update: {
        planId: PILOT_35_PLAN.id,
        status: SubscriptionStatus.ACTIVE,
        responsesLimit: PILOT_35_PLAN.responsesLimit,
        periodStart,
        periodEnd,
        source: SubscriptionSource.RAZORPAY,
      },
    });

    return {
      planId: subscription.planId,
      status: subscription.status,
      responsesLimit: subscription.responsesLimit,
      responsesUsed: subscription.responsesUsed,
      periodEnd: subscription.periodEnd,
    };
  }

  async activateUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    return this.confirmPaymentLinkReturn(user.id);
  }
}
