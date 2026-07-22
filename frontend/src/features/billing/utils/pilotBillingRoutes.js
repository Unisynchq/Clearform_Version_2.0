/** Query param on signup/signin when user arrives from clearform.in pilot CTA. */
export const PILOT_PLAN_QUERY_VALUE = 'pilot';

/** Post-auth destination: Profile → Billing with upgrade intent. */
export const PILOT_BILLING_PATH = '/dashboard/profile?tab=billing&upgrade=pilot';

/** Primary landing CTA URL — sign up first, then billing. */
export const PILOT_LANDING_ENTRY_URL = 'https://app.clearform.in/?plan=pilot';

/** Sign-in deep link when marketing prefers login over signup. */
export const PILOT_LANDING_SIGNIN_URL =
  'https://app.clearform.in/signin?returnTo=%2Fdashboard%2Fprofile%3Ftab%3Dbilling%26upgrade%3Dpilot';

export function isPilotPlanIntent(searchParams) {
  return searchParams?.get('plan') === PILOT_PLAN_QUERY_VALUE;
}

export function resolvePilotReturnTo(searchParams) {
  return isPilotPlanIntent(searchParams) ? PILOT_BILLING_PATH : undefined;
}
