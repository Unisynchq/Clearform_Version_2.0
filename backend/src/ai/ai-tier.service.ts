import { Injectable } from '@nestjs/common';
import { BillingService } from '../billing/billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { isPilotSubscriptionActive } from '../billing/entitlements/plan-entitlement.util';

export type AiTier = 'free' | 'pro';

@Injectable()
export class AiTierService {
  constructor(
    private readonly billing: BillingService,
    private readonly prisma: PrismaService,
  ) {}

  async resolveTierForUser(userId: string | undefined): Promise<AiTier> {
    if (!userId) return 'free';
    const [sub, purchase] = await Promise.all([
      this.billing.getSubscriptionRecord(userId),
      this.prisma.pilotPurchase.findUnique({ where: { userId } }),
    ]);
    if (isPilotSubscriptionActive(sub, purchase)) {
      return 'pro';
    }
    return 'free';
  }

  async resolveTierForFormOwner(formId: string): Promise<AiTier> {
    const { tier } = await this.resolveTierAndOwner(formId);
    return tier;
  }

  /** Tier plus the owning user id, for entitlement checks and spend tracking. */
  async resolveTierAndOwner(
    formId: string,
  ): Promise<{ tier: AiTier; ownerUserId: string | null }> {
    const form = await this.billing.findFormOwnerId(formId);
    if (!form?.ownerId) return { tier: 'free', ownerUserId: null };
    const tier = await this.resolveTierForUser(form.ownerId);
    return { tier, ownerUserId: form.ownerId };
  }
}
