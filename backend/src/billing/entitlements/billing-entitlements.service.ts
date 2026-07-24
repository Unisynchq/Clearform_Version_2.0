import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FormStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FREE_PLAN, PILOT_35_PLAN, getPlan } from '../../config/plans';
import {
  effectivePlanId,
  isPilotSubscriptionActive,
} from './plan-entitlement.util';

/**
 * Structured 403 body consumed by the frontend upgrade gate
 * (UpgradeGateModal). Keep the shape stable — the client switches on `code`.
 */
export type UpgradeRequiredPayload = {
  statusCode: 403;
  error: 'Forbidden';
  code: 'UPGRADE_REQUIRED';
  feature: string;
  message: string;
  quota?: {
    used: number;
    limit: number;
    period: 'lifetime' | 'daily' | 'month';
  };
  upgradePlanId: string;
};

export function upgradeRequired(
  feature: string,
  message: string,
  quota?: UpgradeRequiredPayload['quota'],
): ForbiddenException {
  const payload: UpgradeRequiredPayload = {
    statusCode: 403,
    error: 'Forbidden',
    code: 'UPGRADE_REQUIRED',
    feature,
    message,
    ...(quota ? { quota } : {}),
    upgradePlanId: PILOT_35_PLAN.id,
  };
  return new ForbiddenException(payload);
}

export type WorkspaceEntitlement = {
  used: number;
  limit: number;
  frozenWorkspaceIds: string[];
};

@Injectable()
export class BillingEntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  private async loadEntitlementContext(userId: string) {
    const [sub, purchase] = await Promise.all([
      this.prisma.subscription.findUnique({ where: { userId } }),
      this.prisma.pilotPurchase.findUnique({ where: { userId } }),
    ]);
    const planId = effectivePlanId(sub, purchase);
    return { sub, purchase, planId, limits: getPlan(planId) ?? FREE_PLAN };
  }

  async getSubscriptionRecord(userId: string) {
    return this.prisma.subscription.findUnique({ where: { userId } });
  }

  /** Effective plan capabilities for a user (falls back to Free). */
  async getPlanForUser(userId: string) {
    const { limits } = await this.loadEntitlementContext(userId);
    return limits;
  }

  async hasProAiBundle(userId: string): Promise<boolean> {
    const { sub, purchase } = await this.loadEntitlementContext(userId);
    return isPilotSubscriptionActive(sub, purchase);
  }

  async assertCanCreateForm(
    userId: string,
    workspaceId?: string,
  ): Promise<void> {
    const { limits } = await this.loadEntitlementContext(userId);

    // Workspaces beyond the plan limit are grandfathered (never deleted or
    // hidden) but frozen: no new forms may be created inside them.
    if (workspaceId) {
      const frozen = await this.frozenWorkspaceIds(
        userId,
        limits.workspacesLimit,
      );
      if (frozen.includes(workspaceId)) {
        throw upgradeRequired(
          'workspace',
          `This workspace is over your plan's limit of ${limits.workspacesLimit}. Existing forms keep working, but new forms need an upgrade to Clearform Pilot (${PILOT_35_PLAN.workspacesLimit} workspaces).`,
        );
      }
    }

    if (limits.formsLimit == null) return;

    const used = await this.prisma.form.count({
      where: {
        ownerId: userId,
        status: { notIn: [FormStatus.TRASH, FormStatus.ARCHIVED] },
      },
    });
    if (used >= limits.formsLimit) {
      throw upgradeRequired(
        'forms',
        `Form limit reached (${limits.formsLimit}). Upgrade to Clearform Pilot to create more forms.`,
        { used, limit: limits.formsLimit, period: 'lifetime' },
      );
    }
  }

  async assertCanCreateWorkspace(userId: string): Promise<void> {
    const { limits } = await this.loadEntitlementContext(userId);
    const used = await this.prisma.workspace.count({
      where: { ownerId: userId },
    });
    if (used >= limits.workspacesLimit) {
      throw upgradeRequired(
        'workspace',
        `Workspace limit reached (${limits.workspacesLimit}). Clearform Pilot includes ${PILOT_35_PLAN.workspacesLimit} workspaces.`,
        { used, limit: limits.workspacesLimit, period: 'lifetime' },
      );
    }
  }

  /**
   * Workspaces past the plan limit, oldest-first keeps entitlement: the first
   * `limit` workspaces by creation date stay active, the rest are frozen.
   */
  private async frozenWorkspaceIds(
    userId: string,
    limit: number,
  ): Promise<string[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    return workspaces.slice(limit).map((w) => w.id);
  }

  async getWorkspaceEntitlement(userId: string): Promise<WorkspaceEntitlement> {
    const { limits } = await this.loadEntitlementContext(userId);
    const workspaces = await this.prisma.workspace.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    return {
      used: workspaces.length,
      limit: limits.workspacesLimit,
      frozenWorkspaceIds: workspaces
        .slice(limits.workspacesLimit)
        .map((w) => w.id),
    };
  }

  async assertCanAcceptResponse(formId: string): Promise<void> {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: { ownerId: true },
    });
    if (!form) throw new NotFoundException('Form not found');

    const { sub, purchase, limits } = await this.loadEntitlementContext(
      form.ownerId,
    );
    if (!isPilotSubscriptionActive(sub, purchase)) {
      const responsesUsed = sub?.responsesUsed ?? 0;
      const responsesLimit = limits.responsesLimit;
      if (responsesUsed >= responsesLimit) {
        throw new ForbiddenException(
          `Response limit reached (${responsesLimit}). Upgrade to Clearform Pilot to collect more responses.`,
        );
      }
      return;
    }

    const responsesUsed = sub?.responsesUsed ?? 0;
    const responsesLimit = sub?.responsesLimit ?? limits.responsesLimit;
    if (responsesUsed >= responsesLimit) {
      throw new ForbiddenException(
        `Response limit reached (${responsesLimit}). Upgrade to Clearform Pilot to collect more responses.`,
      );
    }
  }

  async incrementResponsesUsedForForm(formId: string): Promise<void> {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: { ownerId: true },
    });
    if (!form) return;

    const { sub, purchase, limits } = await this.loadEntitlementContext(
      form.ownerId,
    );
    const periodEnd = this.addYears(new Date(), 10);

    if (sub) {
      await this.prisma.subscription.update({
        where: { userId: form.ownerId },
        data: { responsesUsed: { increment: 1 } },
      });
      return;
    }

    await this.prisma.subscription.create({
      data: {
        userId: form.ownerId,
        planId: effectivePlanId(null, null),
        status: SubscriptionStatus.ACTIVE,
        responsesLimit: limits.responsesLimit,
        responsesUsed: 1,
        periodStart: new Date(),
        periodEnd,
      },
    });
  }

  private addYears(base: Date, years: number): Date {
    const end = new Date(base);
    end.setFullYear(end.getFullYear() + years);
    return end;
  }
}
