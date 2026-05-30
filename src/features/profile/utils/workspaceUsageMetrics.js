import { FREE_PLAN, getActivePlanDisplay } from '@/features/profile/utils/profileBillingPlans';
import { readBillingSubscription } from '@/features/profile/utils/profileBillingStorage';

/**
 * Count submitted responses in the current calendar month from persisted records.
 * @param {Record<string, { submittedAt?: string }[]>} responsesByFormId
 */
export function countResponsesThisMonth(responsesByFormId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  let count = 0;

  for (const list of Object.values(responsesByFormId ?? {})) {
    if (!Array.isArray(list)) continue;
    for (const record of list) {
      if (!record?.submittedAt) continue;
      const d = new Date(record.submittedAt);
      if (Number.isNaN(d.getTime())) continue;
      if (d.getFullYear() === year && d.getMonth() === month) count += 1;
    }
  }

  return count;
}

/** Sum per-form response counts from Redux forms slice (all-time, not month-scoped). */
export function sumFormResponseCounts(forms) {
  return (forms ?? []).reduce((acc, form) => acc + (form.responses ?? 0), 0);
}

/**
 * Workspace usage aligned with billing meters — sourced from live Redux + localStorage, not demo constants.
 * @param {{
 *   forms: { id?: number, responses?: number }[],
 *   email?: string | null,
 *   responsesByFormId?: Record<string, { submittedAt?: string }[]>,
 * }} params
 */
export function getWorkspaceUsageMetrics({ forms = [], email = null, responsesByFormId = {} }) {
  const subscription = email ? readBillingSubscription(email) : null;
  const paidPlan = subscription
    ? getActivePlanDisplay(subscription.planId, subscription.interval)
    : null;
  const plan = paidPlan ?? FREE_PLAN;

  const formsUsed = subscription?.usage?.formsUsed ?? forms.length;

  const monthlyFromRecords = countResponsesThisMonth(responsesByFormId);
  const allTimeFromForms = sumFormResponseCounts(forms);
  const responsesUsed =
    subscription?.usage?.responsesThisMonth ??
    (monthlyFromRecords > 0 ? monthlyFromRecords : allTimeFromForms);

  const teamUsed = subscription?.usage?.teamUsed ?? 1;

  return {
    formsUsed,
    responsesUsed,
    teamUsed,
    formsLimit: plan.formsLimit,
    responsesLimit: plan.responsesLimit,
    teamLimit: plan.teamLimit,
    planId: plan.id ?? 'pilot',
    planName: plan.name,
    responsesSource:
      subscription?.usage?.responsesThisMonth != null
        ? 'subscription'
        : monthlyFromRecords > 0
          ? 'monthly_records'
          : 'form_totals',
  };
}
