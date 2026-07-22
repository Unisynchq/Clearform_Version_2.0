import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiTier } from './ai-tier.service';
import type { LlmCompletionOptions, LlmTask } from './llm-gateway.service';

/**
 * Gemini Developer API, OpenAI-compatible surface. The sole provider for pro
 * tier (see LlmGatewayService.completion) — one API key, best model per task.
 */
const GEMINI_OPENAI_BASE =
  'https://generativelanguage.googleapis.com/v1beta/openai';

const DEFAULT_MODEL_BY_TIER: Record<AiTier, string> = {
  pro: 'gemini-2.5-flash',
  free: 'gemini-2.5-flash-lite',
};

export type GeminiCompletionOutcome =
  | {
      ok: true;
      content: string;
      model: string;
      promptTokens?: number;
      outputTokens?: number;
    }
  | { ok: false; model: string; error: string };

@Injectable()
export class GeminiGatewayService {
  private readonly logger = new Logger(GeminiGatewayService.name);

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return Boolean(this.config.get<string>('GEMINI_API_KEY')?.trim());
  }

  modelForTier(tier: AiTier): string {
    const override =
      tier === 'pro'
        ? this.config.get<string>('GEMINI_MODEL_PRO')?.trim()
        : this.config.get<string>('GEMINI_MODEL_FREE')?.trim();
    return override || DEFAULT_MODEL_BY_TIER[tier];
  }

  /**
   * Per-task override on top of the tier default.
   *   - free: flash-lite (OpenRouter primary; Gemini is the reliability
   *     fallback when free endpoints 404/429).
   *   - pro fast: flash — low latency for live quality / improve / Cleo.
   *   - pro insights/logic: pro — deeper reasoning, latency-tolerant.
   */
  modelForTask(task: LlmTask, tier: AiTier): string {
    if (tier === 'pro' && (task === 'logic' || task === 'insights')) {
      const envKey =
        task === 'logic'
          ? 'GEMINI_MODEL_LOGIC_PRO'
          : 'GEMINI_MODEL_INSIGHTS_PRO';
      const override = this.config.get<string>(envKey)?.trim();
      return override || 'gemini-2.5-pro';
    }
    return this.modelForTier(tier);
  }

  /** Returns null only when the service is disabled (no API key). */
  async completion(
    options: LlmCompletionOptions,
  ): Promise<GeminiCompletionOutcome | null> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY')?.trim();
    if (!apiKey) return null;

    const model = this.modelForTask(
      options.task ?? 'fast',
      options.tier ?? 'free',
    );
    const body: Record<string, unknown> = {
      model,
      messages: options.messages,
      max_tokens: options.maxTokens ?? 400,
      temperature: options.temperature ?? 0,
    };
    if (options.jsonMode) {
      body.response_format = { type: 'json_object' };
    }
    // Gemini 2.5 models think by default and the OpenAI-compat layer bills
    // those thinking tokens against max_tokens — a 400-token budget can burn
    // entirely on hidden reasoning and leave 0 tokens for the visible JSON,
    // truncating it mid-string. gemini-2.5-pro can't disable thinking, so it
    // gets the lowest setting instead of "none".
    body.reasoning_effort = model.endsWith('-pro') ? 'low' : 'none';

    const timeoutMs = options.timeoutMs ?? 15_000;
    try {
      const res = await fetch(`${GEMINI_OPENAI_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        const error = `HTTP ${res.status}${errText ? `: ${errText.slice(0, 160)}` : ''}`;
        this.logger.warn(`Gemini ${error} model=${model}`);
        return { ok: false, model, error };
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const content = json.choices?.[0]?.message?.content?.trim();
      if (!content) {
        return { ok: false, model, error: 'empty completion' };
      }
      return {
        ok: true,
        content,
        model,
        promptTokens: json.usage?.prompt_tokens,
        outputTokens: json.usage?.completion_tokens,
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Gemini request failed model=${model}: ${reason}`);
      return { ok: false, model, error: reason.slice(0, 160) };
    }
  }
}
