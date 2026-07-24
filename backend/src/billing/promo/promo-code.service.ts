import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FormStatus,
  Prisma,
  SubscriptionSource,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PILOT_35_PLAN, PROMO_TRIAL_DAYS } from '../../config/plans';
import { BillingStatusResponse } from '../billing.types';
import { enrichBillingStatusForSubscription } from '../billing-status.util';
import { isPilotSubscriptionActive } from '../entitlements/plan-entitlement.util';
import { AiEntitlementsService } from '../entitlements/ai-entitlements.service';

@Injectable()
export class PromoCodeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiEntitlements: AiEntitlementsService,
  ) {}

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

  async redeem(
    userId: string,
    rawCode: string,
  ): Promise<BillingStatusResponse> {
    const code = rawCode.trim().toUpperCase();

    const existingSub = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    if (
      existingSub?.source === SubscriptionSource.RAZORPAY &&
      isPilotSubscriptionActive(existingSub, null)
    ) {
      throw new BadRequestException('You already have an active pilot plan.');
    }

    const existingRedemption = await this.prisma.promoRedemption.findUnique({
      where: { userId },
    });
    if (existingRedemption) {
      throw new BadRequestException(
        "You've already used a promo code on this account.",
      );
    }

    let subscription: Prisma.SubscriptionGetPayload<Record<string, never>>;
    let periodEnd: Date;
    let grantedTrialDays: number;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const promoCode = await tx.promoCode.findUnique({ where: { code } });
        if (!promoCode || !promoCode.active) {
          throw new NotFoundException('Invalid code');
        }

        const trialDays = promoCode.durationDays ?? PROMO_TRIAL_DAYS;
        const periodStart = new Date();
        const grantedExpiresAt = new Date(periodStart);
        grantedExpiresAt.setDate(grantedExpiresAt.getDate() + trialDays);

        const sub = await tx.subscription.upsert({
          where: { userId },
          create: {
            userId,
            planId: PILOT_35_PLAN.id,
            status: SubscriptionStatus.ACTIVE,
            responsesLimit: PILOT_35_PLAN.responsesLimit,
            responsesUsed: 0,
            periodStart,
            periodEnd: grantedExpiresAt,
            source: SubscriptionSource.PROMO,
          },
          update: {
            planId: PILOT_35_PLAN.id,
            status: SubscriptionStatus.ACTIVE,
            responsesLimit: PILOT_35_PLAN.responsesLimit,
            periodStart,
            periodEnd: grantedExpiresAt,
            source: SubscriptionSource.PROMO,
          },
        });

        await tx.promoRedemption.create({
          data: { promoCodeId: promoCode.id, userId, grantedExpiresAt },
        });
        await tx.promoCode.update({
          where: { id: promoCode.id },
          data: { redemptionCount: { increment: 1 } },
        });

        return { sub, grantedExpiresAt, trialDays };
      });

      subscription = result.sub;
      periodEnd = result.grantedExpiresAt;
      grantedTrialDays = result.trialDays;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException(
          "You've already used a promo code on this account.",
        );
      }
      throw err;
    }

    await this.aiEntitlements.resetAiTokenWallet(userId);

    const status = enrichBillingStatusForSubscription(
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
        expiresAt: periodEnd,
        source: subscription.source,
      },
      subscription,
      null,
    );
    return { ...status, trialDays: grantedTrialDays };
  }
}
