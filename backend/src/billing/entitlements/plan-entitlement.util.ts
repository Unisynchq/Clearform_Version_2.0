import { Subscription, SubscriptionStatus } from '@prisma/client';
import { FREE_PLAN, PILOT_35_PLAN } from '../../config/plans';

type PilotPurchaseLike = { expiresAt: Date } | null | undefined;

/** True when user has an active paid pilot window (status + not past expiresAt/periodEnd). */
export function isPilotSubscriptionActive(
  sub: Subscription | null | undefined,
  purchase?: PilotPurchaseLike,
): boolean {
  if (!sub || sub.planId !== PILOT_35_PLAN.id) return false;
  const statusOk =
    sub.status === SubscriptionStatus.ACTIVE ||
    sub.status === SubscriptionStatus.TRIAL;
  if (!statusOk) return false;
  const end = purchase?.expiresAt ?? sub.periodEnd;
  return end instanceof Date && end.getTime() > Date.now();
}

/** Plan id used for limits + AI tier (pilot when active, otherwise free). */
export function effectivePlanId(
  sub: Subscription | null | undefined,
  purchase?: PilotPurchaseLike,
): string {
  return isPilotSubscriptionActive(sub, purchase)
    ? PILOT_35_PLAN.id
    : FREE_PLAN.id;
}

export function pilotExpiryDate(
  sub: Subscription | null | undefined,
  purchase?: PilotPurchaseLike,
): Date | null {
  if (!sub || sub.planId !== PILOT_35_PLAN.id) return null;
  return purchase?.expiresAt ?? sub.periodEnd ?? null;
}

export function isPilotExpired(
  sub: Subscription | null | undefined,
  purchase?: PilotPurchaseLike,
): boolean {
  if (!sub || sub.planId !== PILOT_35_PLAN.id) return false;
  const end = pilotExpiryDate(sub, purchase);
  if (!end) return false;
  return end.getTime() <= Date.now();
}
