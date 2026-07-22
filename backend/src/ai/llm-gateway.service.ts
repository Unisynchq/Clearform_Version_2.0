import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Redis } from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { GeminiGatewayService } from './gemini-gateway.service';
import type { AiTier } from './ai-tier.service';

export type LlmTask = 'fast' | 'insights' | 'logic' | 'embedding';

/**
 * Rough USD per 1M tokens for spend estimation only (circuit-breaker, not
 * billing). Unknown models fall back to the conservative default.
 */
const MODEL_PRICES_PER_M: Record<string, { input: number; output: number }> = {
  'gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },
  'gemini-2.5-flash': { input: 0.3, output: 2.5 },
  'gemini-2.5-pro': { input: 1.25, output: 10 },
  // OpenRouter direct models (free tier only).
  'openrouter/free': { input: 0, output: 0 },
  'google/gemma-4-26b-a4b-it:free': { input: 0, output: 0 },
  'nvidia/nemotron-nano-9b-v2:free': { input: 0, output: 0 },
  'openai/gpt-oss-20b:free': { input: 0, output: 0 },
  'meta-llama/llama-3.2-3b-instruct:free': { input: 0, output: 0 },
  'meta-llama/llama-3.3-70b-instruct:free': { input: 0, output: 0 },
};
const DEFAULT_PRICE_PER_M = { input: 1, output: 4 };
const warnedUnknownModels = new Set<string>();

function estimateCallCostUsd(
  model: string,
  promptTokens?: number,
  outputTokens?: number,
): number {
  const price = MODEL_PRICES_PER_M[model] ?? DEFAULT_PRICE_PER_M;
  return (
    ((promptTokens ?? 0) * price.input + (outputTokens ?? 0) * price.output) /
    1_000_000
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function dailySpendKey(): string {
  return `ai:spend:${today()}`;
}

function tierSpendKey(tier: AiTier): string {
  return `ai:spend:tier:${tier}:${today()}`;
}

function userSpendKey(ownerUserId: string): string {
  return `ai:spend:user:${ownerUserId}:${today()}`;
}

const DAILY_SPEND_TTL_SECONDS = 48 * 3600;

/**
 * Per-provider circuit breaker: after CB_FAIL_THRESHOLD consecutive failures
 * the ladder skips that rung for CB_OPEN_MS instead of paying its timeout on
 * every request. In-process state (one breaker per instance) — good enough
 * for the current single-node PM2 deploy and never *blocks* traffic, only
 * skips a known-bad provider briefly.
 */
const CB_FAIL_THRESHOLD = 5;
const CB_OPEN_MS = 60_000;

type BreakerState = { consecutiveFails: number; openUntil: number };

/**
 * Free-tier chat models via OpenRouter, tried in order. Keep this list in
 * sync with live `:free` endpoints — dead slugs burn latency before the
 * Gemini flash-lite fallback. Pro never uses this map.
 */
const OPENROUTER_FREE_MODELS: Record<LlmTask, string[]> = {
  fast: [
    'google/gemma-4-26b-a4b-it:free',
    'nvidia/nemotron-nano-9b-v2:free',
    'openai/gpt-oss-20b:free',
    'openrouter/free',
  ],
  insights: [
    'google/gemma-4-26b-a4b-it:free',
    'openai/gpt-oss-20b:free',
    'openrouter/free',
  ],
  logic: [
    'google/gemma-4-26b-a4b-it:free',
    'openai/gpt-oss-20b:free',
    'openrouter/free',
  ],
  // Unused by completion() — embed() below has its own dedicated model.
  embedding: ['openai/text-embedding-3-small'],
};

/** Cap OpenRouter tries so free traffic fails fast into Gemini flash-lite. */
const FREE_OPENROUTER_DEFAULT_MAX_MODELS = 2;

/** Embeddings always go through OpenRouter — no Gemini embedding integration. */
const OPENROUTER_EMBEDDING_MODEL = 'openai/text-embedding-3-small';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type LlmCompletionOptions = {
  task: LlmTask;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  tier?: AiTier;
  /** For per-call observability (ai_call_logs); optional. */
  formId?: string;
  /** Form owner — enables per-user spend audit in ai_call_logs. */
  ownerUserId?: string;
  /** Per-task abort timeout in ms. Defaults to 15 000. */
  timeoutMs?: number;
  /** Hard cap across all model attempts in this call (ms). */
  deadlineMs?: number;
  /** Limit OpenRouter free-tier fallback models tried (default: all). */
  maxFallbackModels?: number;
};

@Injectable()
export class LlmGatewayService {
  private readonly logger = new Logger(LlmGatewayService.name);
  private readonly breakers = new Map<string, BreakerState>();

  constructor(
    private readonly config: ConfigService,
    private readonly gemini: GeminiGatewayService,
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  private trackSpend(
    model: string,
    tier: AiTier,
    ownerUserId: string | undefined,
    promptTokens?: number,
    outputTokens?: number,
  ): number {
    if (!MODEL_PRICES_PER_M[model] && !warnedUnknownModels.has(model)) {
      warnedUnknownModels.add(model);
      this.logger.warn(
        `No price entry for model ${model} — using conservative default for spend tracking`,
      );
    }
    const cost = estimateCallCostUsd(model, promptTokens, outputTokens);
    if (cost <= 0) return cost;
    const keys = [
      dailySpendKey(),
      tierSpendKey(tier),
      ...(ownerUserId ? [userSpendKey(ownerUserId)] : []),
    ];
    for (const key of keys) {
      void this.redis
        .incrbyfloat(key, cost)
        .then(() => this.redis.expire(key, DAILY_SPEND_TTL_SECONDS))
        .catch(() => {});
    }
    return cost;
  }

  private breakerOpen(provider: string): boolean {
    const state = this.breakers.get(provider);
    if (!state) return false;
    if (state.openUntil > Date.now()) return true;
    return false;
  }

  private breakerRecord(provider: string, success: boolean): void {
    const state = this.breakers.get(provider) ?? {
      consecutiveFails: 0,
      openUntil: 0,
    };
    if (success) {
      state.consecutiveFails = 0;
      state.openUntil = 0;
    } else {
      state.consecutiveFails += 1;
      if (state.consecutiveFails >= CB_FAIL_THRESHOLD) {
        state.openUntil = Date.now() + CB_OPEN_MS;
        this.logger.warn(
          `Provider ${provider} circuit opened for ${CB_OPEN_MS / 1000}s after ${state.consecutiveFails} consecutive failures`,
        );
      }
    }
    this.breakers.set(provider, state);
  }

  isConfigured(): boolean {
    return Boolean(
      this.gemini.isEnabled() ||
      this.config.get<string>('OPENROUTER_API_KEY')?.trim(),
    );
  }

  async completion(options: LlmCompletionOptions): Promise<string | null> {
    const tier = options.tier ?? 'free';
    const startedAt = Date.now();
    const deadlineMs = options.deadlineMs;
    const perAttemptTimeout = options.timeoutMs ?? 15_000;
    // When a provider fails without returning usage, estimate prompt tokens
    // for ai_call_logs cost tracking only — wallet debits happen at action boundaries.
    const promptTokensEstimate = Math.ceil(
      options.messages.reduce((sum, m) => sum + m.content.length, 0) / 4,
    );

    const resolveAttemptTimeout = (): number => {
      if (!deadlineMs) return perAttemptTimeout;
      const remaining = deadlineMs - (Date.now() - startedAt);
      if (remaining <= 0) return 0;
      return Math.min(perAttemptTimeout, remaining);
    };

    if (tier === 'pro') {
      // Pro/pilot/promo-trial: Gemini directly, best model per task (see
      // GeminiGatewayService.modelForTask). No OpenRouter/LiteLLM fallback —
      // one well-tested provider beats hopping across a ladder of flaky rungs.
      if (!this.gemini.isEnabled() || this.breakerOpen('gemini')) return null;
      const attemptTimeout = resolveAttemptTimeout();
      if (attemptTimeout <= 0) return null;
      const attemptStart = Date.now();
      const outcome = await this.gemini.completion({
        ...options,
        timeoutMs: attemptTimeout,
      });
      this.breakerRecord('gemini', Boolean(outcome?.ok));
      if (!outcome) return null;
      const latencyMs = Date.now() - attemptStart;
      this.recordCall({
        formId: options.formId,
        ownerUserId: options.ownerUserId,
        task: options.task,
        tier,
        provider: 'gemini',
        model: outcome.model,
        latencyMs,
        promptTokens: outcome.ok ? outcome.promptTokens : undefined,
        outputTokens: outcome.ok ? outcome.outputTokens : undefined,
        promptTokensEstimate,
        success: outcome.ok,
        errorSnippet: outcome.ok ? undefined : outcome.error,
      });
      if (!outcome.ok) return null;
      this.logger.log(
        `LLM ok provider=gemini model=${outcome.model} task=${options.task} tier=pro latencyMs=${latencyMs}`,
      );
      return outcome.content;
    }

    // Free tier: OpenRouter first (curated free models), then Gemini
    // flash-lite so brownouts/429s on free endpoints don't force weak
    // rules-only coaching tips.
    const openRouterKey = this.config.get<string>('OPENROUTER_API_KEY')?.trim();
    if (openRouterKey && !this.breakerOpen('openrouter')) {
      const headers = {
        Authorization: `Bearer ${openRouterKey}`,
        'HTTP-Referer':
          this.config.get<string>('APP_URL') ?? 'https://clearform.in',
        'X-Title': 'Clearform',
      };

      const fallbackModels = OPENROUTER_FREE_MODELS[options.task];
      const maxModels =
        options.maxFallbackModels ??
        Math.min(FREE_OPENROUTER_DEFAULT_MAX_MODELS, fallbackModels.length);
      for (const model of fallbackModels.slice(0, maxModels)) {
        const attemptTimeout = resolveAttemptTimeout();
        if (attemptTimeout <= 0) break;
        const attemptStart = Date.now();
        const result = await this.callChatCompletions(
          'https://openrouter.ai/api/v1/chat/completions',
          model,
          { ...options, timeoutMs: attemptTimeout },
          headers,
        );
        this.breakerRecord('openrouter', Boolean(result));
        const latencyMs = Date.now() - attemptStart;
        this.recordCall({
          formId: options.formId,
          ownerUserId: options.ownerUserId,
          task: options.task,
          tier,
          provider: 'openrouter',
          model,
          latencyMs,
          promptTokens: result?.promptTokens,
          outputTokens: result?.outputTokens,
          promptTokensEstimate,
          success: Boolean(result),
          errorSnippet: result ? undefined : 'no completion',
        });
        if (result) {
          this.logger.log(
            `LLM ok provider=openrouter model=${model} task=${options.task} tier=${tier} latencyMs=${latencyMs}`,
          );
          return result.content;
        }
      }
    }

    if (!this.gemini.isEnabled() || this.breakerOpen('gemini')) return null;
    const attemptTimeout = resolveAttemptTimeout();
    if (attemptTimeout <= 0) return null;
    const attemptStart = Date.now();
    const outcome = await this.gemini.completion({
      ...options,
      timeoutMs: attemptTimeout,
    });
    this.breakerRecord('gemini', Boolean(outcome?.ok));
    if (!outcome) return null;
    const latencyMs = Date.now() - attemptStart;
    this.recordCall({
      formId: options.formId,
      ownerUserId: options.ownerUserId,
      task: options.task,
      tier,
      provider: 'gemini',
      model: outcome.model,
      latencyMs,
      promptTokens: outcome.ok ? outcome.promptTokens : undefined,
      outputTokens: outcome.ok ? outcome.outputTokens : undefined,
      promptTokensEstimate,
      success: outcome.ok,
      errorSnippet: outcome.ok ? undefined : outcome.error,
    });
    if (!outcome.ok) return null;
    this.logger.log(
      `LLM ok provider=gemini model=${outcome.model} task=${options.task} tier=free latencyMs=${latencyMs}`,
    );
    return outcome.content;
  }

  /** Fire-and-forget observability row; must never fail or delay a request. */
  private recordCall(entry: {
    formId?: string;
    ownerUserId?: string;
    task: LlmTask;
    tier: AiTier;
    provider: 'gemini' | 'openrouter';
    model: string;
    latencyMs: number;
    promptTokens?: number;
    outputTokens?: number;
    /** chars/4 estimate used when the provider returned no usage (failures). */
    promptTokensEstimate?: number;
    success: boolean;
    errorSnippet?: string;
  }): void {
    // Failed calls still burned the prompt — count them, or a provider
    // brownout under-reports spend exactly when the breaker matters most.
    const promptForSpend =
      entry.promptTokens ??
      (entry.success ? 0 : (entry.promptTokensEstimate ?? 0));
    const costUsd = this.trackSpend(
      entry.model,
      entry.tier,
      entry.ownerUserId,
      promptForSpend > 0 ? promptForSpend : undefined,
      entry.outputTokens,
    );
    void this.prisma.aiCallLog
      .create({
        data: {
          formId: entry.formId ?? null,
          ownerUserId: entry.ownerUserId ?? null,
          task: entry.task,
          tier: entry.tier,
          provider: entry.provider,
          model: entry.model,
          latencyMs: entry.latencyMs,
          promptTokens: entry.promptTokens ?? null,
          outputTokens: entry.outputTokens ?? null,
          costUsd,
          success: entry.success,
          errorSnippet: entry.errorSnippet ?? null,
        },
      })
      .catch((err: unknown) => {
        this.logger.warn(
          `ai_call_logs write skipped: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
  }

  /** Embedding vector (1536-dim) via OpenRouter — same model for both tiers. */
  async embed(text: string): Promise<number[] | null> {
    const input = text.slice(0, 8000);
    const openRouterKey = this.config.get<string>('OPENROUTER_API_KEY')?.trim();
    if (!openRouterKey) return null;

    return this.callEmbeddings(
      'https://openrouter.ai/api/v1/embeddings',
      OPENROUTER_EMBEDDING_MODEL,
      input,
      {
        Authorization: `Bearer ${openRouterKey}`,
        'HTTP-Referer':
          this.config.get<string>('APP_URL') ?? 'https://clearform.in',
        'X-Title': 'Clearform',
      },
    );
  }

  private async callEmbeddings(
    url: string,
    model: string,
    input: string,
    extraHeaders: Record<string, string>,
    timeoutMs = 15_000,
  ): Promise<number[] | null> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...extraHeaders,
        },
        body: JSON.stringify({ model, input }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        this.logger.warn(
          `Embedding HTTP ${res.status} model=${model}${errText ? `: ${errText.slice(0, 120)}` : ''}`,
        );
        return null;
      }

      const json = (await res.json()) as {
        data?: { embedding?: number[] }[];
      };
      const vector = json.data?.[0]?.embedding;
      return Array.isArray(vector) && vector.length > 0 ? vector : null;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Embedding request failed model=${model}: ${reason}`);
      return null;
    }
  }

  private async callChatCompletions(
    url: string,
    model: string,
    options: LlmCompletionOptions,
    extraHeaders: Record<string, string>,
  ): Promise<{
    content: string;
    promptTokens?: number;
    outputTokens?: number;
  } | null> {
    const body: Record<string, unknown> = {
      model,
      messages: options.messages,
      max_tokens: options.maxTokens ?? 400,
      temperature: options.temperature ?? 0,
    };
    if (options.jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const timeoutMs = options.timeoutMs ?? 15_000;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...extraHeaders,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1500));
        return null;
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        this.logger.warn(
          `LLM HTTP ${res.status} model=${model}${errText ? `: ${errText.slice(0, 160)}` : ''}`,
        );
        return null;
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const content = json.choices?.[0]?.message?.content?.trim();
      if (!content) return null;
      return {
        content,
        promptTokens: json.usage?.prompt_tokens,
        outputTokens: json.usage?.completion_tokens,
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.warn(`LLM request failed model=${model}: ${reason}`);
      return null;
    }
  }
}
