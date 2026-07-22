import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmGatewayService } from '../llm-gateway.service';
import { QdrantMemoryService } from './qdrant-memory.service';
import { SupermemoryService } from './supermemory.service';
import { randomUUID } from 'crypto';

/**
 * Passive internal observer — read-only DB access, writes only to Cleo memory
 * stores (Qdrant / Supermemory). Never touches forms, responses, or live AI paths.
 */
@Injectable()
export class CleoJarvisService {
  private readonly logger = new Logger(CleoJarvisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmGatewayService,
    private readonly qdrant: QdrantMemoryService,
    private readonly supermemory: SupermemoryService,
  ) {}

  async runPassiveObservation(): Promise<{ observations: number }> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [failedCalls, negativeFeedback, qualityEvals] = await Promise.all([
      this.prisma.aiCallLog.findMany({
        where: { createdAt: { gte: since }, success: false },
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: {
          task: true,
          provider: true,
          model: true,
          errorSnippet: true,
          formId: true,
          latencyMs: true,
        },
      }),
      this.prisma.aiFeedback.findMany({
        where: { rating: -1, createdAt: { gte: since } },
        take: 30,
        select: {
          aiDecision: true,
          formId: true,
          screenId: true,
        },
      }),
      this.prisma.aiCallLog.count({
        where: {
          createdAt: { gte: since },
          task: 'fast',
          success: true,
        },
      }),
    ]);

    if (
      failedCalls.length === 0 &&
      negativeFeedback.length === 0 &&
      qualityEvals === 0
    ) {
      this.logger.log('Cleo Jarvis: quiet period — no signals to observe');
      return { observations: 0 };
    }

    const summaryInput = [
      `Period: last 24h ending ${new Date().toISOString()}`,
      `Successful quality LLM calls: ${qualityEvals}`,
      `Failed LLM calls: ${failedCalls.length}`,
      failedCalls.length
        ? `Failure samples:\n${failedCalls
            .slice(0, 8)
            .map(
              (r) =>
                `- task=${r.task} provider=${r.provider} form=${r.formId ?? 'n/a'} err=${(r.errorSnippet ?? '').slice(0, 120)}`,
            )
            .join('\n')}`
        : '',
      negativeFeedback.length
        ? `Builder corrections: ${negativeFeedback.length} thumbs-down on AI decisions`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const observation = await this.llm.completion({
      messages: [
        {
          role: 'system',
          content:
            'You are Cleo, Clearform internal ops assistant. Summarize system health for engineers. ' +
            'Read-only context — suggest root causes and what to check next. No user-facing copy. 3-5 bullet points max.',
        },
        { role: 'user', content: summaryInput },
      ],
      task: 'fast',
      tier: 'free',
      timeoutMs: 25_000,
    });

    if (!observation?.trim()) {
      this.logger.warn('Cleo Jarvis: LLM returned empty observation');
      return { observations: 0 };
    }

    const text = observation.trim();
    const embedding = await this.llm.embed(text);

    if (this.qdrant.isEnabled && embedding) {
      await this.qdrant.upsertRule(randomUUID(), embedding, {
        rule: text,
        aiDecision: 'system_observation',
        formArchetype: 'generic',
        correctionCount: 0,
        createdAt: new Date().toISOString(),
      });
    }

    if (this.supermemory.isEnabled) {
      await this.supermemory.addMemory(text, ['cleo', 'jarvis', 'observation']);
    }

    this.logger.log('Cleo Jarvis: stored passive observation');
    return { observations: 1 };
  }
}
