/**
 * Product-facing AI credit costs. One successful product action = one debit.
 * Nested LLM retries inside an action do NOT multiply credits.
 * Provider tokens stay in ai_call_logs for margin tracking only.
 */
export const AI_CREDIT_ACTIONS = {
  quality_evaluate: 1,
  improve_instructions: 2,
  logic_generate: 5,
  insights_generate: 3,
  overview_insight: 2,
  best_responses: 2,
} as const;

export type AiCreditAction = keyof typeof AI_CREDIT_ACTIONS;

export function creditsForAction(action: AiCreditAction): number {
  return AI_CREDIT_ACTIONS[action];
}
