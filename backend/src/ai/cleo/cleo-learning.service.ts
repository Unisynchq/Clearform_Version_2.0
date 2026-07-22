import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmGatewayService } from '../llm-gateway.service';
import { FormMemoryService } from '../form-memory.service';
import { QdrantMemoryService } from './qdrant-memory.service';
import { SupermemoryService } from './supermemory.service';
import { randomUUID } from 'crypto';
import { detectArchetypeFromSnapshot } from '../quality/archetype.util';

interface CorrectionGroup {
  aiDecision: string;
  samples: { answer: string; screenId: string | null }[];
}

@Injectable()
export class CleoLearningService {
  private readonly logger = new Logger(CleoLearningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmGatewayService,
    private readonly memory: FormMemoryService,
    private readonly qdrant: QdrantMemoryService,
    private readonly supermemory: SupermemoryService,
  ) {}

  /**
   * Main nightly run — processes the last 24h of builder corrections
   * and distils them into stored rules for both pgvector and Qdrant.
   */
  async runNightlyLearning(): Promise<{ processed: number; rulesDistilled: number }> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const corrections = await (this.prisma as any).aiFeedback.findMany({
      where: { rating: -1, createdAt: { gte: since } },
      include: { form: { select: { id: true, title: true, publishedSnapshot: true, builderSnapshot: true } } },
    }) as Array<{
      formId: string;
      aiDecision: string;
      actualAnswer: string | null;
      screenId: string | null;
      form: { id: string; title: string; publishedSnapshot: unknown; builderSnapshot: unknown };
    }>;

    if (corrections.length === 0) {
      this.logger.log('Cleo: no corrections in last 24h — nothing to learn');
      return { processed: 0, rulesDistilled: 0 };
    }

    this.logger.log(`Cleo: processing ${corrections.length} correction(s)`);

    // Group by (formId, aiDecision) so each group produces one focused rule.
    const groups = new Map<string, CorrectionGroup & { formId: string; formTitle: string }>();
    for (const fb of corrections) {
      const key = `${fb.formId}:${fb.aiDecision}`;
      if (!groups.has(key)) {
        groups.set(key, {
          formId: fb.formId,
          formTitle: fb.form.title,
          aiDecision: fb.aiDecision,
          samples: [],
        });
      }
      groups.get(key)!.samples.push({
        answer: fb.actualAnswer ?? '',
        screenId: fb.screenId ?? null,
      });
    }

    let rulesDistilled = 0;
    const ruleSummaries: string[] = [];

    for (const [, group] of groups) {
      const rule = await this.distilRule(group);
      if (!rule) continue;

      await this.storeRule(rule, group.formId, group.aiDecision);
      rulesDistilled++;
      ruleSummaries.push(rule);
    }

    if (ruleSummaries.length > 0) {
      await this.pushSupermemory(ruleSummaries, since);
    }

    this.logger.log(`Cleo: distilled ${rulesDistilled} rule(s) from ${corrections.length} correction(s)`);
    return { processed: corrections.length, rulesDistilled };
  }

  /**
   * Fetches Qdrant platform rules relevant to this form type for scoring context injection.
   * Called by FormContextService during AI scoring to prepend learned corrections.
   */
  async fetchPlatformRulesForContext(
    formArchetype: string,
    aiDecision?: string,
    limit = 3,
  ): Promise<string[]> {
    if (!this.qdrant.isEnabled) return [];

    const queryText = aiDecision
      ? `Quality scoring rule for ${aiDecision} responses in ${formArchetype} forms`
      : `Quality scoring rules for ${formArchetype} forms`;

    const embedding = await this.llm.embed(queryText);
    if (!embedding) return [];

    const rules = await this.qdrant.searchSimilar(embedding, { formArchetype }, limit);
    return rules.map((r) => r.rule);
  }

  private async distilRule(
    group: CorrectionGroup & { formTitle: string },
  ): Promise<string | null> {
    const sampleText = group.samples
      .filter((s) => s.answer.trim().length > 0)
      .slice(0, 5)
      .map((s, i) => `${i + 1}. "${s.answer.trim()}"`)
      .join('\n');

    if (!sampleText) return null;

    const prompt = [
      `You are a quality-scoring calibration assistant for a form platform.`,
      ``,
      `A form builder marked the following answer(s) as INCORRECTLY scored "${group.aiDecision}" by the AI:`,
      sampleText,
      ``,
      `Distil ONE concise correction rule (1-2 sentences) that the AI should apply in future.`,
      `Focus on what pattern makes this answer score wrongly and how to fix it.`,
      `Do not mention the builder, the platform, or this process.`,
      `Return only the rule text, nothing else.`,
    ].join('\n');

    const rule = await this.llm.completion({
      messages: [{ role: 'user', content: prompt }],
      task: 'fast',
      tier: 'free',
      timeoutMs: 20_000,
    });

    return rule?.trim() ?? null;
  }

  private async storeRule(
    rule: string,
    formId: string,
    aiDecision: string,
  ): Promise<void> {
    const embedding = await this.llm.embed(rule);

    // pgvector — per-form chunk so it surfaces when this form's scoring context is built
    if (embedding) {
      await this.memory.storeChunk(formId, 'quality_feedback', rule, { aiDecision }, 'free');
      this.logger.log(`Cleo: stored rule in pgvector for form ${formId} (decision=${aiDecision})`);
    }

    // Qdrant — platform-level, fast lookup across all forms
    if (this.qdrant.isEnabled && embedding) {
      const form = await this.prisma.form.findUnique({
        where: { id: formId },
        select: { publishedSnapshot: true, builderSnapshot: true },
      });
      const archetype = detectArchetypeFromSnapshot(
        form?.publishedSnapshot ?? form?.builderSnapshot,
      );
      await this.qdrant.upsertRule(randomUUID(), embedding, {
        rule,
        aiDecision,
        formArchetype: archetype,
        correctionCount: 1,
        createdAt: new Date().toISOString(),
      });
    }
  }

  private async pushSupermemory(rules: string[], since: Date): Promise<void> {
    if (!this.supermemory.isEnabled) return;
    const summary = [
      `Cleo AI learning run — ${new Date().toISOString().split('T')[0]}`,
      `Period: ${since.toISOString()} → now`,
      `Rules distilled:`,
      ...rules.map((r, i) => `${i + 1}. ${r}`),
    ].join('\n');
    await this.supermemory.addMemory(summary, ['cleo', 'ai-quality', 'correction']);
  }

}
