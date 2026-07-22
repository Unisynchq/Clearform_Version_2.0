/**
 * Single source of truth for plan capabilities. Billing UI feature labels
 * (plan-features.ts) and backend enforcement (BillingEntitlementsService,
 * AiEntitlementsService) both derive from these objects — change a number
 * here and both the advertised list and the enforced limit move together.
 */
export type PlanAiCapabilities = {
  /** Model/depth tier used by the AI subsystem. */
  tier: 'free' | 'pro';
  /**
   * Respondent sessions that receive live LLM response-quality evaluation
   * before the form owner's trial is exhausted. null = unlimited.
   */
  qualityTrialSessions: number | null;
  /** Lifetime AI logic generations per account. null = unlimited. */
  logicGenerationsTotal: number | null;
  /** Access to AI insights / overview generation. */
  insightsAccess: boolean;
  /** Access to per-form learned memory (Cleo RAG). */
  cleoMemory: boolean;
  /**
   * Finite AI credit allotment for the current period (product actions, not LLM tokens).
   * Always a positive number — both Free and Pilot are metered.
   */
  aiCreditsLimit: number;
};

export type PlanDefinition = {
  id: 'free' | 'pilot_35';
  name: string;
  priceUsd?: number;
  durationDays?: number;
  responsesLimit: number;
  formsLimit: number | null;
  workspacesLimit: number;
  aiBundle: boolean;
  ai: PlanAiCapabilities;
};

export const FREE_PLAN = {
  id: 'free',
  name: 'Free',
  responsesLimit: 50,
  formsLimit: null,
  workspacesLimit: 1,
  aiBundle: false,
  ai: {
    tier: 'free',
    // Credit wallet is the gate — no separate session cap.
    qualityTrialSessions: null,
    logicGenerationsTotal: 50,
    insightsAccess: true,
    cleoMemory: false,
    aiCreditsLimit: 100,
  },
} satisfies PlanDefinition;

export const PILOT_35_PLAN = {
  id: 'pilot_35',
  name: 'Clearform Pilot',
  priceUsd: 34.99,
  durationDays: 90,
  responsesLimit: 300,
  formsLimit: null,
  workspacesLimit: 3,
  aiBundle: true,
  ai: {
    tier: 'pro',
    qualityTrialSessions: null,
    logicGenerationsTotal: null,
    insightsAccess: true,
    cleoMemory: true,
    aiCreditsLimit: 2_000,
  },
} satisfies PlanDefinition;

/** Promo-code trial window — deliberately separate from PILOT_35_PLAN.durationDays
 * (the paid 90-day window) and not env-overridable like PILOT_DURATION_DAYS. */
export const PROMO_TRIAL_DAYS = 7;

export type PlanId = typeof PILOT_35_PLAN.id;

export function getPlan(planId: string): PlanDefinition | null {
  if (planId === PILOT_35_PLAN.id) return PILOT_35_PLAN;
  if (planId === FREE_PLAN.id) return FREE_PLAN;
  return null;
}
