import { Subscription } from '@prisma/client';
import { BillingStatusResponse } from './billing.types';
import { FREE_PLAN, getPlan, PILOT_35_PLAN } from '../config/plans';
import {
  aiTierFor,
  periodLabelFor,
  planFeaturesFor,
  planNameFor,
} from '../config/plan-features';
import { isPilotSubscriptionActive } from './entitlements/plan-entitlement.util';

function resolvePlanLimits(planId: string) {
  const plan = getPlan(planId);
  if (plan) return plan;
  return FREE_PLAN;
}

type BillingStatusBase = Omit<
  BillingStatusResponse,
  'planName' | 'aiTier' | 'periodLabel' | 'features' | 'aiCredits' | 'aiTokens'
> & {
  aiCredits?: BillingStatusResponse['aiCredits'];
  aiTokens?: BillingStatusResponse['aiTokens'];
};

export function enrichBillingStatus(
  base: BillingStatusBase,
  options: { effectivePlanId: string; pilotActive: boolean },
): BillingStatusResponse {
  const limits = resolvePlanLimits(options.effectivePlanId);
  const aiBundle = limits.aiBundle && options.pilotActive;
  const defaultCredits: BillingStatusResponse['aiCredits'] = {
    used: 0,
    limit: limits.ai.aiCreditsLimit,
    remaining: limits.ai.aiCreditsLimit,
    periodLabel: options.pilotActive ? 'Pilot period' : 'This month',
  };
  const aiCredits = base.aiCredits ?? base.aiTokens ?? defaultCredits;
  return {
    ...base,
    aiCredits,
    aiTokens: aiCredits,
    planName: planNameFor(
      options.pilotActive && base.planId === PILOT_35_PLAN.id
        ? PILOT_35_PLAN.id
        : base.planId,
    ),
    aiTier: aiTierFor(aiBundle),
    periodLabel: periodLabelFor(
      base.planId,
      base.status,
      options.pilotActive,
      base.source === 'PROMO',
    ),
    features: planFeaturesFor(
      options.pilotActive ? PILOT_35_PLAN.id : FREE_PLAN.id,
      aiBundle,
    ),
  };
}

export function enrichBillingStatusForSubscription(
  base: BillingStatusBase,
  sub: Subscription | null,
  purchase: { expiresAt: Date } | null,
): BillingStatusResponse {
  const pilotActive = isPilotSubscriptionActive(sub, purchase);
  const effectiveId =
    pilotActive && sub?.planId === PILOT_35_PLAN.id
      ? PILOT_35_PLAN.id
      : FREE_PLAN.id;
  return enrichBillingStatus(base, {
    effectivePlanId: effectiveId,
    pilotActive,
  });
}
