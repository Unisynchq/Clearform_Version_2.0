import type { AiTier } from '../ai-tier.service';

/**
 * How much value each tier's quality evaluation delivers. Tier itself is
 * resolved from the owner's plan (src/config/plans.ts `ai.tier`); this map
 * turns the tier into concrete model-call depth. Transport-level rate limits
 * live in src/common/form-ai-rate-limit.service.ts.
 */
export type QualityTierConfig = {
  /** LLM attempts per evaluation (retry with a stricter prompt). */
  llmAttempts: number;
  maxTokens: number;
  /** Higher temperature varies phrasing between answers on pro. */
  temperature: number;
  /** Max suggestions surfaced to the respondent. */
  suggestionsMax: number;
  /** Retrieve per-form learned memory (Cleo RAG) into the prompt. */
  cleoMemory: boolean;
  /** Session-memory richness in the prompt (Phase 6): counts vs narrative. */
  sessionMemoryDepth: 'counts' | 'full';
  /** Static-copy variant pool size (CopyRegistry). */
  copyVariantPool: number;
};

export const QUALITY_TIER_CONFIG: Record<AiTier, QualityTierConfig> = {
  free: {
    llmAttempts: 1,
    maxTokens: 220,
    temperature: 0.2,
    suggestionsMax: 1,
    cleoMemory: false,
    // 'full' adds the answer-trajectory block (prior verdicts + what they
    // wrote last time) to the prompt — without it, free-tier respondents who
    // revise their answer get re-graded cold instead of coached on the
    // delta, which read as "generic"/repetitive feedback. This is a few
    // extra input-context lines, not output tokens, so it doesn't change
    // the maxTokens/cost budget below.
    sessionMemoryDepth: 'full',
    copyVariantPool: 2,
  },
  pro: {
    llmAttempts: 2,
    maxTokens: 280,
    temperature: 0.4,
    suggestionsMax: 2,
    cleoMemory: true,
    sessionMemoryDepth: 'full',
    copyVariantPool: 4,
  },
};
