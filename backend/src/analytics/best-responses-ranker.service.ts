import { Injectable, Logger, Inject } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { safeRedisGet, safeRedisSet } from '../redis/redis-cache.util';
import { LlmGatewayService } from '../ai/llm-gateway.service';
import { FormContextService } from '../ai/form-context.service';
import { AiTierService } from '../ai/ai-tier.service';
import { DoctrineRegistry } from '../ai/doctrine/doctrine.registry';
import type { AiTier } from '../ai/ai-tier.service';
import {
  BEST_RESPONSES_BY_TIER,
  filterResponsesForBestList,
  responseMatchesCurrentForm,
  type BuilderFilteredResponse,
} from './best-responses-filter.util';

const CACHE_TTL_SECONDS = 300;

export type RankedResponseRow = {
  id: string;
  qualityScore: number | null;
  submittedAt: Date;
  answers: Array<{ label?: string; value?: string }>;
  payload: unknown;
  rankScore?: number;
};

export type BestResponsesRankResult = {
  responses: RankedResponseRow[];
  meta: {
    scoringPending: number;
    totalResponses: number;
    rankedBy: 'ai' | 'builder' | 'score';
    rationale?: string;
    tier?: AiTier;
    limit?: number;
    excludedStale?: number;
    excludedLowQuality?: number;
  };
};

function parseRankJson(
  content: string,
  validIds: Set<string>,
): { ids: string[]; rationale?: string } | null {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as {
      rankedResponseIds?: string[];
      rationale?: string;
    };
    if (!Array.isArray(parsed.rankedResponseIds)) return null;
    const ids = parsed.rankedResponseIds.filter((id) =>
      validIds.has(String(id)),
    );
    return {
      ids,
      rationale:
        typeof parsed.rationale === 'string'
          ? parsed.rationale.trim()
          : undefined,
    };
  } catch {
    return null;
  }
}

function toRankedRow(row: BuilderFilteredResponse): RankedResponseRow {
  return {
    id: row.id,
    qualityScore: row.builderScore,
    submittedAt: row.submittedAt,
    answers: row.answers,
    payload: row.payload,
    rankScore: row.builderScore,
  };
}

@Injectable()
export class BestResponsesRankerService {
  private readonly logger = new Logger(BestResponsesRankerService.name);

  constructor(
    private readonly llm: LlmGatewayService,
    private readonly formContext: FormContextService,
    private readonly aiTier: AiTierService,
    private readonly doctrine: DoctrineRegistry,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async rankTopResponses(
    formId: string,
    rows: Array<{
      id: string;
      qualityScore: number | null;
      submittedAt: Date;
      payload: unknown;
    }>,
    snapshot: unknown,
    limit = 5,
    minScore = 75,
    tier: AiTier = 'free',
  ): Promise<BestResponsesRankResult> {
    const tierConfig = BEST_RESPONSES_BY_TIER[tier];
    const effectiveLimit = Math.min(limit, tierConfig.limit);
    const effectiveMinScore = Math.max(minScore, tierConfig.minCompositeScore);
    const cacheKey = `analytics:best:v3:${formId}:${tier}:${effectiveLimit}:${effectiveMinScore}`;
    const cached = await safeRedisGet(this.redis, cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as BestResponsesRankResult;
      } catch {
        /* regenerate */
      }
    }

    const scoringPending = rows.filter((r) => r.qualityScore == null).length;
    const totalResponses = rows.length;

    const filtered = filterResponsesForBestList(rows, snapshot, {
      ...tierConfig,
      minCompositeScore: effectiveMinScore,
    });
    const excludedStale = rows.filter((r) => {
      const payload =
        r.payload && typeof r.payload === 'object' && !Array.isArray(r.payload)
          ? (r.payload as Record<string, unknown>)
          : {};
      return !responseMatchesCurrentForm(payload, snapshot);
    }).length;
    const excludedLowQuality = Math.max(
      0,
      rows.length - excludedStale - filtered.length,
    );

    if (filtered.length === 0) {
      return {
        responses: [],
        meta: {
          scoringPending,
          totalResponses,
          rankedBy: 'builder',
          tier,
          limit: effectiveLimit,
          excludedStale,
          excludedLowQuality,
        },
      };
    }

    let ranked: RankedResponseRow[] = filtered.map(toRankedRow);
    let rankedBy: 'ai' | 'builder' | 'score' = 'builder';
    let rationale: string | undefined;

    if (
      tierConfig.useLlmRank &&
      this.llm.isConfigured() &&
      filtered.length >= 2
    ) {
      try {
        const context = await this.formContext.buildForForm(formId);
        const validIds = new Set(filtered.map((r) => r.id));
        const qaBlock = filtered
          .map((r) => {
            const qa = r.answers
              .map((a) => `  Q: ${a.label}\n  A: ${a.value}`)
              .join('\n');
            return `id: ${r.id}\nbuilderScore: ${r.builderScore}\n${qa || '  (no text answers)'}`;
          })
          .join('\n\n');

        const doctrine = this.doctrine.getDoctrine(
          'best-responses',
          context.archetype,
        );
        const directiveLines = context.screens
          .filter((s) => s.customInstructions?.trim())
          .map((s) => `- "${s.label}": ${s.customInstructions!.trim()}`)
          .join('\n');
        const userPrompt =
          `${doctrine ? `${doctrine}\n\n---\n\n` : ''}` +
          `formTitle: ${context.title}\n` +
          `formPurpose: ${context.purpose ?? '(not provided)'}\n` +
          (directiveLines
            ? `Owner directives per question — score answers against these:\n${directiveLines}\n`
            : '') +
          `All candidates already passed builder quality gates (no gibberish/off-topic).\n` +
          `Pick up to ${effectiveLimit} best responses.\n\n` +
          `Responses:\n${qaBlock}`;

        const content = await this.llm.completion({
          task: 'insights',
          tier,
          formId,
          messages: [
            {
              role: 'system',
              content: 'Rank form responses by quality. Return JSON only.',
            },
            { role: 'user', content: userPrompt },
          ],
          maxTokens: 600,
          temperature: 0.2,
          jsonMode: true,
        });

        const parsed = content ? parseRankJson(content, validIds) : null;
        if (parsed?.ids.length) {
          const byId = new Map(filtered.map((r) => [r.id, r]));
          ranked = parsed.ids
            .slice(0, effectiveLimit)
            .map((id) => byId.get(id))
            .filter((r): r is BuilderFilteredResponse => r != null)
            .map(toRankedRow);
          rankedBy = 'ai';
          rationale = parsed.rationale;
        }
      } catch (err) {
        this.logger.warn(
          `Best responses LLM rank failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    ranked = ranked.slice(0, effectiveLimit);

    const result: BestResponsesRankResult = {
      responses: ranked,
      meta: {
        scoringPending,
        totalResponses,
        rankedBy,
        rationale,
        tier,
        limit: effectiveLimit,
        excludedStale,
        excludedLowQuality,
      },
    };

    await safeRedisSet(
      this.redis,
      cacheKey,
      JSON.stringify(result),
      CACHE_TTL_SECONDS,
    );

    return result;
  }
}
