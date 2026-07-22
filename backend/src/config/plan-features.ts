import { FREE_PLAN, PILOT_35_PLAN, PlanDefinition, getPlan } from './plans';

export type PlanFeature = {
  id: string;
  label: string;
  included: boolean;
};

function workspaceLabel(plan: PlanDefinition): string {
  return `${plan.workspacesLimit} workspace${plan.workspacesLimit === 1 ? '' : 's'}`;
}

export function planFeaturesFor(
  planId: string,
  aiBundle: boolean,
): PlanFeature[] {
  const plan = getPlan(planId) ?? FREE_PLAN;

  const base: PlanFeature[] = [
    {
      id: 'unlimited_forms',
      label: 'Unlimited forms',
      included: plan.formsLimit === null,
    },
    {
      id: 'responses',
      label:
        plan.id === PILOT_35_PLAN.id
          ? `${plan.responsesLimit} responses (${PILOT_35_PLAN.durationDays}-day pilot)`
          : `${plan.responsesLimit} responses`,
      included: true,
    },
    {
      id: 'workspace',
      label: workspaceLabel(plan),
      included: true,
    },
    {
      id: 'rule_quality',
      label: 'Rule-based response quality checks',
      included: true,
    },
  ];

  if (aiBundle) {
    return [
      ...base,
      {
        id: 'ai_credits',
        label: `${plan.ai.aiCreditsLimit.toLocaleString('en-US')} AI credits / pilot`,
        included: true,
      },
      {
        id: 'ai_quality',
        label: 'AI response quality (live nudges + post-submit scoring)',
        included: true,
      },
      {
        id: 'ai_insights',
        label: 'AI insights from real answer text',
        included: true,
      },
      {
        id: 'ai_logic',
        label: 'AI logic generation',
        included: true,
      },
      {
        id: 'form_memory',
        label: 'Per-form AI memory (Cleo pgvector)',
        included: true,
      },
      {
        id: 'premium_models',
        label: 'Premium AI models (pro tier)',
        included: true,
      },
    ];
  }

  const trialFeatures: PlanFeature[] = [
    {
      id: 'ai_credits',
      label: `${plan.ai.aiCreditsLimit.toLocaleString('en-US')} AI credits / month`,
      included: true,
    },
    {
      id: 'ai_insights',
      label: 'AI insights (within credit allowance)',
      included: plan.ai.insightsAccess,
    },
  ];
  if (plan.ai.qualityTrialSessions != null) {
    trialFeatures.push({
      id: 'ai_quality_trial',
      label: `AI response quality — up to ${plan.ai.qualityTrialSessions} respondent sessions`,
      included: true,
    });
  }
  if (plan.ai.logicGenerationsTotal != null) {
    trialFeatures.push({
      id: 'ai_logic_trial',
      label: `${plan.ai.logicGenerationsTotal} AI logic generations included`,
      included: true,
    });
  }

  return [...base, ...trialFeatures];
}

export function planNameFor(planId: string): string {
  if (planId === PILOT_35_PLAN.id) return PILOT_35_PLAN.name;
  return FREE_PLAN.name;
}

export function periodLabelFor(
  planId: string,
  status: string,
  pilotActive: boolean,
  isTrial = false,
): string {
  if (planId === PILOT_35_PLAN.id && pilotActive) {
    return isTrial ? 'Pilot trial' : `${PILOT_35_PLAN.durationDays}-day pilot`;
  }
  if (status === 'EXPIRED') return 'Pilot expired — free tier limits apply';
  return 'Free tier (cumulative response count)';
}

export function aiTierFor(aiBundle: boolean): 'free' | 'pro' {
  return aiBundle ? 'pro' : 'free';
}
