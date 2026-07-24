import { Injectable, Logger, Inject } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LlmGatewayService } from './llm-gateway.service';
import { FormContextService } from './form-context.service';
import { FormMemoryService } from './form-memory.service';
import {
  DoctrineRegistry,
  type DoctrineTask,
} from './doctrine/doctrine.registry';
import { GroundingValidatorService } from './grounding-validator.service';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { REDIS_KEYS, REDIS_TTL } from '../common/redis-cache-keys';
import { safeRedisGet, safeRedisSet } from '../redis/redis-cache.util';
import { CleoLearningService } from './cleo/cleo-learning.service';
import type { FormContext } from './form-context.types';
import {
  buildHeuristicFormLogic,
  buildLinearFormLogic,
  repairLogicGraph,
  type FormLogicGraph,
  type LogicScreenInput,
} from './form-logic-heuristic.util';
import { parseSnapshotScreens } from '../responses/answer-format.util';
import type {
  EvaluateQualityDto,
  GenerateLogicDto,
  QualityResult,
} from './ai.service.types';
import { normalizeQualityOptions } from './ai-quality-rules.util';
import { QuestionIntentService } from './question-intent/question-intent.service';
import {
  computeScreenDropoff,
  worstDropStep,
} from '../analytics/analytics-snapshot.util';
import type { AiTier } from './ai-tier.service';
import type {
  QualityPipelineContext,
  QualityPipelineDeps,
  QualityStageOutcome,
} from './quality/pipeline/quality-pipeline.types';
import {
  buildQualityCacheKey,
  cacheLookupStage,
  cacheStore,
} from './quality/pipeline/cache.stage';
import { contextStage } from './quality/pipeline/context.stage';
import { intentStage } from './quality/pipeline/intent.stage';
import { violationStage } from './quality/pipeline/violation.stage';
import { llmStage } from './quality/pipeline/llm.stage';
import { finalizeStage } from './quality/pipeline/finalize.stage';
import { dedupeAgainstSession } from './quality/pipeline/anti-repeat.util';
import { QUALITY_TIER_CONFIG } from './quality/quality-tier.config';
import { QualitySessionMemoryService } from './quality/quality-session-memory.service';
import { buildLogicRequestContext } from './logic-request-context.util';
import { aiServiceUnavailable } from './errors/ai-service-unavailable.error';

export type AiOrchestratorTask =
  | 'response-quality'
  | 'logic-generation'
  | 'insights'
  | 'overview';

type InsightsOrchestratorResult = {
  summaryText: string;
  priorityTitle: string;
  priorityBody: string;
  topIssueCategory: string;
  confidencePercent: number | null;
};

type OverviewOrchestratorResult = {
  message: string;
  actionableStep: {
    action: 'improve_screen' | 'open_logic' | 'view_analytics';
    screenId?: number | string;
    screenLabel?: string;
    dropPercent?: number;
    estimatedGain?: number;
    builderTab?: string;
  };
};

function parseLogicJsonFromLlm(content: string): FormLogicGraph | null {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let raw = match[0];
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const parsed = JSON.parse(raw) as FormLogicGraph;
      if (Array.isArray(parsed.connections) && parsed.connections.length > 0) {
        return {
          connections: parsed.connections,
          ifRulesByEdge: parsed.ifRulesByEdge ?? {},
          showIfByScreenId: parsed.showIfByScreenId ?? {},
        };
      }
      return null;
    } catch {
      raw = raw
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/[\u201c\u201d]/g, '"');
    }
  }
  return null;
}

function parseInsightsJson(content: string): InsightsOrchestratorResult | null {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as InsightsOrchestratorResult;
    if (parsed.summaryText && parsed.priorityBody) return parsed;
  } catch {
    /* fall through */
  }
  return null;
}

function parseOverviewJson(content: string): OverviewOrchestratorResult | null {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as OverviewOrchestratorResult;
    if (parsed.message) return parsed;
  } catch {
    /* fall through */
  }
  return null;
}

function hashLogicSnapshot(snapshot: Record<string, unknown> | null): string {
  if (!snapshot) return 'empty';
  const payload = JSON.stringify({
    screens: snapshot.screens ?? [],
    contentScreens: snapshot.contentScreens ?? [],
    title: snapshot.title ?? snapshot.formTitle ?? '',
  });
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

function rangeCutoff(range?: string): Date | undefined {
  if (!range || range === 'all') return undefined;
  const days =
    range === '7d'
      ? 7
      : range === '30d'
        ? 30
        : range === '90d'
          ? 90
          : undefined;
  if (!days) return undefined;
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  constructor(
    private readonly formContext: FormContextService,
    private readonly doctrine: DoctrineRegistry,
    private readonly memory: FormMemoryService,
    private readonly grounding: GroundingValidatorService,
    private readonly llm: LlmGatewayService,
    private readonly prisma: PrismaService,
    private readonly cleo: CleoLearningService,
    private readonly questionIntent: QuestionIntentService,
    private readonly sessionMemory: QualitySessionMemoryService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Live respondent answer evaluation, run as an ordered pipeline:
   * cache → context → intent → violation → llm → finalize (error if LLM fails).
   * No rules-only fallback — callers must gate entitlements and LLM config first.
   */
  async executeQuality(
    formId: string | undefined,
    dto: EvaluateQualityDto,
    tier: AiTier = 'free',
    opts: { ownerUserId?: string; preferBuilderSnapshot?: boolean } = {},
  ): Promise<QualityResult> {
    if (!this.llm.isConfigured()) {
      throw aiServiceUnavailable(
        'llm_not_configured',
        'AI response coaching is temporarily unavailable.',
      );
    }

    const deps: QualityPipelineDeps = {
      formContext: this.formContext,
      doctrine: this.doctrine,
      memory: this.memory,
      grounding: this.grounding,
      llm: this.llm,
      questionIntent: this.questionIntent,
      redis: this.redis,
      logger: this.logger,
    };

    const sessionId = dto.sessionId;
    const session =
      formId && sessionId
        ? await this.sessionMemory.load(formId, sessionId)
        : null;
    const sessionDigest = session
      ? this.sessionMemory.screenDigest(session, dto.screenId)
      : undefined;

    const ctx: QualityPipelineContext = {
      formId,
      dto,
      tier,
      cacheKey: buildQualityCacheKey({
        formId,
        dto,
        tier,
        doctrineVersion: this.doctrine.getVersion(),
        sessionDigest,
      }),
      context: null,
      enrichedDto: dto,
      text: '',
      intent: 'generic',
      effectiveOptions: dto.options,
      normalized: normalizeQualityOptions(dto.options),
      violationKind: 'none',
      sessionId,
      session,
      ownerUserId: opts.ownerUserId,
      preferBuilderSnapshot: opts.preferBuilderSnapshot,
      meta: { stagesRun: [] },
    };

    const stages: Array<
      [
        string,
        (
          c: QualityPipelineContext,
          d: QualityPipelineDeps,
        ) => Promise<QualityStageOutcome>,
      ]
    > = [
      ['cache', cacheLookupStage],
      ['context', contextStage],
      ['intent', intentStage],
      ['violation', violationStage],
      ['llm', llmStage],
      ['finalize', finalizeStage],
    ];

    for (const [name, stage] of stages) {
      ctx.meta.stagesRun.push(name);
      const outcome = await stage(ctx, deps);
      if (!outcome) continue;

      let result = outcome.result;
      if (name !== 'cache') {
        result = dedupeAgainstSession(
          result,
          ctx.session?.screens[String(dto.screenId)],
          {
            seed: `${formId ?? 'anon'}:${dto.screenId}:${ctx.text}`,
            poolSize: QUALITY_TIER_CONFIG[tier].copyVariantPool,
            answerText: ctx.text,
            questionText: dto.questionText,
            session: ctx.session,
          },
        );
        if (outcome.cache) await cacheStore(ctx, deps, result);
      }
      if (formId && sessionId) {
        void this.sessionMemory
          .recordResult({
            formId,
            sessionId,
            screenId: dto.screenId,
            result,
            violationKind: ctx.violationKind,
            answerText: ctx.text,
          })
          .catch(() => {});
      }
      // Attached after cacheStore so cached entries stay source-free and a
      // cache hit honestly reports source: 'cache'.
      return { ...result, meta: { ...result.meta, source: name, tier } };
    }
    throw aiServiceUnavailable(
      'llm_failed',
      'AI could not evaluate this answer. The coaching service has stopped — please try again.',
    );
  }

  async executeLogicGeneration(
    formId: string,
    input: GenerateLogicDto | undefined,
    tier: AiTier = 'free',
    ownerUserId?: string,
  ): Promise<FormLogicGraph & { meta: { source: string } }> {
    let context = await this.formContext.buildForLogicOnly(formId);
    if (Array.isArray(input?.screens) && input.screens.length > 0) {
      context = buildLogicRequestContext(formId, input, context.title);
    }

    // Template/unsaved forms may have no snapshot yet — return linear fallback immediately.
    if (!context.snapshot) {
      return {
        connections: [],
        ifRulesByEdge: {},
        showIfByScreenId: {},
        meta: { source: 'linear_fallback' },
      };
    }

    const snapshotHash = hashLogicSnapshot(
      context.snapshot as Record<string, unknown>,
    );
    const cacheKey = REDIS_KEYS.aiLogic(formId, snapshotHash);
    const cachedRaw = await safeRedisGet(this.redis, cacheKey);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as FormLogicGraph;
        if (
          Array.isArray(cached.connections) &&
          cached.connections.length > 0 &&
          this.grounding.validateLogicGraph(cached, context).ok
        ) {
          return { ...cached, meta: { source: 'redis_cache' } };
        }
      } catch {
        /* regenerate */
      }
    }

    // Snapshot labels are block-type names ("Long text"); swap in the
    // resolved question text so the prompt describes the form, not the UI kit.
    const contentLabelById = new Map(
      context.contentScreens.map((s) => [Number(s.id), s.label]),
    );
    const allScreens: LogicScreenInput[] = parseSnapshotScreens(
      context.snapshot,
    ).map((s) => ({
      id: Number(s.id),
      label: contentLabelById.get(Number(s.id)) ?? String(s.label ?? ''),
      type: String(s.type ?? 'content'),
    }));
    const contentScreens = context.contentScreens.map((s) => ({
      id: s.id,
      label: s.label,
      type: 'content' as const,
    }));

    if (contentScreens.length === 0) {
      return {
        connections: [],
        ifRulesByEdge: {},
        showIfByScreenId: {},
        meta: { source: 'linear_fallback' },
      };
    }

    const heuristic = () =>
      buildHeuristicFormLogic({ screens: allScreens, contentScreens });

    if (!this.llm.isConfigured()) {
      const graph = heuristic();
      return { ...graph, meta: { source: 'heuristic_fallback' } };
    }

    const doctrinePrompt = this.doctrine.getDoctrine(
      'logic-generation',
      context.archetype,
    );
    // Content screens carry fieldType + choice option labels so if-rules can
    // reference real answers; the full screen list (intro/end included) tells
    // the model the flow it must cover start to end.
    const screensJson = JSON.stringify(context.contentScreens);
    const allScreensJson = JSON.stringify(allScreens);
    const deptHint = context.departmentFields?.length
      ? `Department fields on screens: ${context.departmentFields.join(', ')}. Branch by department when options exist.\n`
      : '';

    const baseUserPrompt =
      `${deptHint}Form: ${context.title}\nPurpose: ${context.purpose}\n` +
      `All screens (intro → content → end): ${allScreensJson}\n` +
      `Question screens (with field types and choice options): ${screensJson}\n` +
      `Read every question before branching. Cover the whole form: every screen must be reachable from the intro and the flow must reach the end screen. ` +
      `When a screen lists choice options, write if-rules against those exact option values.\n` +
      `Return ONLY JSON: {"connections":[...],"ifRulesByEdge":{...},"showIfByScreenId":{}}`;

    // Run both attempts in parallel — first valid result wins. Structurally
    // sound graphs with minor referential slips are repaired, not discarded.
    const tryAttempt = async (strict: boolean): Promise<FormLogicGraph> => {
      const content = await this.llm.completion({
        task: 'logic',
        tier,
        formId,
        ownerUserId,
        messages: [
          { role: 'system', content: doctrinePrompt },
          {
            role: 'user',
            content: strict
              ? `${baseUserPrompt}\nSTRICT: every screenId must exist in the snapshot.`
              : baseUserPrompt,
          },
        ],
        maxTokens: 2000,
        temperature: 0,
        jsonMode: true,
        timeoutMs: 35_000,
      });
      const parsed = content ? parseLogicJsonFromLlm(content) : null;
      if (!parsed) throw new Error('unparseable');
      const repaired = repairLogicGraph(parsed, allScreens, contentScreens);
      if (this.grounding.validateLogicGraph(repaired, context).ok) {
        return repaired;
      }
      throw new Error('invalid');
    };

    const parsed = await Promise.any([
      tryAttempt(false),
      tryAttempt(true),
    ]).catch(() => null);

    if (parsed) {
      void this.memory.storeChunk(
        formId,
        'logic_pattern',
        JSON.stringify(parsed).slice(0, 2000),
        { source: 'llm' },
        tier,
      );
      await safeRedisSet(
        this.redis,
        cacheKey,
        JSON.stringify(parsed),
        REDIS_TTL.aiLogicSeconds,
      );
      return { ...parsed, meta: { source: 'llm' } };
    }

    this.logger.warn(
      `Logic LLM both attempts failed for form ${formId}, using heuristic`,
    );
    const graph = heuristic();
    const hasIf = graph.connections.some((c) => c.kind === 'if');
    return {
      ...(hasIf ? graph : buildLinearFormLogic(allScreens)),
      meta: { source: hasIf ? 'heuristic_fallback' : 'linear_fallback' },
    };
  }

  async executeInsights(
    formId: string,
    range = 'all',
    tier: AiTier = 'free',
  ): Promise<InsightsOrchestratorResult> {
    const context = await this.loadContextWithMemory(
      formId,
      'insights',
      range,
      tier,
    );
    const { count, completionRate, avgQuality } = context.responseStats;
    const statsLine = `${count} responses, ${completionRate}% completion, avg quality ${avgQuality ?? 0}/100.`;

    const cutoff = rangeCutoff(range);
    const rows = await this.prisma.formResponse.findMany({
      where: {
        formId,
        ...(cutoff && { createdAt: { gte: cutoff } }),
      },
      select: { payload: true, status: true, durationMs: true },
    });
    const screenDropoff = computeScreenDropoff(context.snapshot, rows);
    const worst = worstDropStep(screenDropoff);
    const dropHint = worst
      ? `Worst drop-off: "${worst.label}" (${worst.q}) loses ${worst.dropPercent}%.`
      : '';

    if (this.llm.isConfigured() && count >= 10) {
      const doctrinePrompt = this.doctrine.getDoctrine(
        'insights',
        context.archetype,
      );
      const maxAttempts = tier === 'pro' ? 2 : 1;
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const strict = attempt > 0;
        try {
          const content = await this.llm.completion({
            task: 'insights',
            tier,
            formId,
            messages: [
              { role: 'system', content: doctrinePrompt },
              {
                role: 'user',
                content:
                  `Form: ${context.title}\nPurpose: ${context.purpose}\n` +
                  `Stats: ${statsLine}\n${dropHint}\n\n` +
                  `Q&A excerpt:\n${context.recentAnswersExcerpt}\n` +
                  (strict
                    ? '\nSTRICT: summaryText and priorityBody must differ.'
                    : ''),
              },
            ],
            maxTokens: tier === 'pro' ? 600 : 500,
            temperature: 0.35,
            jsonMode: true,
            timeoutMs: 55_000,
          });
          const parsed = content ? parseInsightsJson(content) : null;
          if (parsed && this.grounding.validateInsights(parsed, context).ok) {
            const confidence = this.grounding.deriveConfidencePercent(
              count,
              true,
            );
            void this.memory.storeChunk(
              formId,
              'insight_theme',
              parsed.priorityBody.slice(0, 500),
              { topIssueCategory: parsed.topIssueCategory },
              tier,
            );
            return { ...parsed, confidencePercent: confidence };
          }
        } catch (err) {
          this.logger.warn(`Insights LLM attempt failed: ${errMessage(err)}`);
        }
      }
    }

    return this.ruleBasedInsights(context, worst, statsLine);
  }

  async executeOverview(
    formId: string,
    tier: AiTier = 'free',
  ): Promise<OverviewOrchestratorResult | null> {
    const context = await this.formContext.buildForForm(formId);
    const { count, completionRate } = context.responseStats;
    if (count < 3) return null;

    const rows = await this.prisma.formResponse.findMany({
      where: { formId },
      select: { payload: true, status: true, durationMs: true },
    });
    const screenDropoff = computeScreenDropoff(context.snapshot, rows);
    const worst = worstDropStep(screenDropoff);
    if (!worst || worst.dropPercent < 20) return null;

    const estimatedGain = Math.max(
      1,
      Math.round((worst.dropCount / Math.max(count, 1)) * count),
    );
    const fallback: OverviewOrchestratorResult = {
      message: `Completion is ${completionRate}% — ${worst.q} (${worst.label}) loses ${worst.dropPercent}% of respondents who reach it. Shorten helper text to recover ~${estimatedGain} completions.`,
      actionableStep: {
        action: 'improve_screen',
        screenId: worst.screenId,
        screenLabel: worst.label,
        dropPercent: worst.dropPercent,
        estimatedGain,
        builderTab: 'content',
      },
    };

    if (!this.llm.isConfigured()) {
      return this.grounding.validateOverviewInsight(fallback, context).ok
        ? fallback
        : null;
    }

    const doctrinePrompt = this.doctrine.getDoctrine(
      'overview',
      context.archetype,
    );
    for (const strict of [false, true]) {
      try {
        const content = await this.llm.completion({
          task: 'insights',
          tier,
          formId,
          messages: [
            { role: 'system', content: doctrinePrompt },
            {
              role: 'user',
              content:
                `Form: ${context.title}\nCompletion: ${completionRate}%\n` +
                `Drop-off: ${worst.q} "${worst.label}" ${worst.dropPercent}% (${worst.dropCount} dropped of ${worst.reached} reached)\n` +
                `Return JSON: {"message":"...","actionableStep":{"action":"improve_screen","screenId":${worst.screenId},"screenLabel":"...","dropPercent":${worst.dropPercent},"estimatedGain":${estimatedGain},"builderTab":"content"}}\n` +
                (strict ? 'STRICT: cite real screen label only.' : ''),
            },
          ],
          maxTokens: 280,
          temperature: 0.3,
          jsonMode: true,
          timeoutMs: 12_000,
        });
        const parsed = content ? parseOverviewJson(content) : null;
        if (
          parsed &&
          this.grounding.validateOverviewInsight(parsed, context).ok
        ) {
          return parsed;
        }
      } catch (err) {
        this.logger.warn(`Overview LLM attempt failed: ${errMessage(err)}`);
      }
    }

    return this.grounding.validateOverviewInsight(fallback, context).ok
      ? fallback
      : null;
  }

  private async loadContextWithMemory(
    formId: string,
    task: DoctrineTask,
    range = 'all',
    tier: AiTier = 'free',
  ): Promise<FormContext> {
    const context = await this.formContext.buildForForm(formId, range);
    // Cleo learned-rule memory is a paid-tier capability (plans.ts
    // ai.cleoMemory → QUALITY_TIER_CONFIG.cleoMemory), not an inline check.
    if (!QUALITY_TIER_CONFIG[tier].cleoMemory) {
      return context;
    }

    const query = `${context.title} ${context.purpose} ${task}`;
    const [chunks, cleoRules] = await Promise.all([
      this.memory.retrieveSimilar(formId, query, 3, tier),
      this.cleo.fetchPlatformRulesForContext(context.archetype),
    ]);

    const texts = [...chunks.map((c) => c.content), ...cleoRules];
    const excerpt = texts.join('\n');
    const merged = this.formContext.withMemoryExcerpt(context, excerpt);
    return { ...merged, memoryChunks: texts };
  }

  private ruleBasedInsights(
    context: FormContext,
    worst: ReturnType<typeof worstDropStep>,
    statsLine: string,
  ): InsightsOrchestratorResult {
    const { count, completionRate, avgQuality } = context.responseStats;
    const summaryText = `${statsLine} Review themes in recent answers.`;
    const priorityBody = worst
      ? `${worst.dropPercent}% drop at "${worst.label}". Open the builder and shorten that question or make it optional.`
      : completionRate < 50
        ? `Only ${completionRate}% complete — reduce required fields on early screens.`
        : `Avg quality ${avgQuality ?? 0}/100 — tighten open-ended question wording using the Responses tab.`;

    return {
      summaryText,
      priorityTitle: worst
        ? `Fix drop-off at "${worst.label}"`
        : 'Review response quality',
      priorityBody,
      topIssueCategory:
        completionRate < 50 ? 'Incomplete submissions' : 'Answer quality',
      confidencePercent: this.grounding.deriveConfidencePercent(count, true),
    };
  }
}
