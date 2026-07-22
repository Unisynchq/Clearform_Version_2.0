import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AiOrchestratorService } from '../ai-orchestrator.service';
import {
  resolveHelperTextFromScreen,
} from '../snapshot-screen.util';
import { AiEntitlementsService } from '../../billing/entitlements/ai-entitlements.service';
import { AiTierService } from '../ai-tier.service';
import {
  buildAnswersFromSnapshot,
  parseSnapshotScreens,
} from '../../responses/answer-format.util';
import { qualityLevelToScore } from '../ai-quality.util';
import {
  customInstructionsFromScreen,
  qualityOptionsFromScreen,
} from '../quality/quality-snapshot.util';
import type { EvaluateQualityDto } from '../ai.service.types';

function answersMapFromPayload(raw: unknown): Record<string, unknown> {
  const payload =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  return (
    (payload.answersByScreenId as Record<string, unknown> | undefined) ??
    (payload.data &&
    typeof payload.data === 'object' &&
    !Array.isArray(payload.data)
      ? ((payload.data as Record<string, unknown>).answersByScreenId as
          | Record<string, unknown>
          | undefined)
      : undefined) ??
    {}
  );
}

@Processor('ai-quality', { drainDelay: 30_000, stalledInterval: 300_000, concurrency: 2 })
export class QualityProcessor extends WorkerHost {
  private readonly logger = new Logger(QualityProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: AiOrchestratorService,
    private readonly aiTier: AiTierService,
    private readonly aiEntitlements: AiEntitlementsService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { responseId, answers, formId } = job.data as {
      responseId: string;
      answers: unknown;
      formId?: string;
    };

    try {
      if (!formId) {
        await this.prisma.formResponse.update({
          where: { id: responseId },
          data: { status: 'PROCESSED' },
        });
        return;
      }

      const form = await this.prisma.form.findUnique({
        where: { id: formId },
        select: { publishedSnapshot: true, builderSnapshot: true },
      });
      const snapshot = form?.publishedSnapshot ?? form?.builderSnapshot ?? null;
      const snapshotRecord =
        snapshot && typeof snapshot === 'object'
          ? (snapshot as Record<string, unknown>)
          : null;
      const intro = (snapshotRecord?.intro ?? {}) as Record<string, unknown>;
      const formTitle = String(
        snapshotRecord?.title ?? snapshotRecord?.name ?? '',
      ).trim();
      const formPurpose = String(
        intro.description ?? intro.subtitle ?? snapshotRecord?.description ?? '',
      ).trim();
      const answersMap = answersMapFromPayload(answers);
      const screens = parseSnapshotScreens(snapshot).filter(
        (s) => s.type === 'content' && s.id != null,
      );

      const { tier, ownerUserId } = await this.aiTier.resolveTierAndOwner(formId);
      let accessBlocked = false;
      if (ownerUserId) {
        const access = await this.aiEntitlements.peekQualityAiAccess(
          ownerUserId,
          formId,
        );
        accessBlocked = access === 'rules-only';
      } else {
        accessBlocked = true;
      }

      const pairs = buildAnswersFromSnapshot(screens, answersMap);
      const evalResults: number[] = [];

      for (const pair of pairs) {
        if (!pair.value || pair.value === '—') continue;
        if (accessBlocked) break;
        const screen = screens.find((s) => String(s.id) === pair.screenId);
        if (!screen) continue;

        // Post-submit scoring must see the same owner guidance the respondent
        // saw live — otherwise the stored score can contradict the banner.
        const dto: EvaluateQualityDto = {
          screenId: String(screen.id),
          fieldId: pair.screenId,
          text: pair.value,
          answerText: pair.value,
          questionText: pair.label,
          helperText: resolveHelperTextFromScreen(
            screen as Record<string, unknown>,
          ),
          formTitle: formTitle || undefined,
          formPurpose: formPurpose || undefined,
          options: qualityOptionsFromScreen(screen),
          customInstructions: customInstructionsFromScreen(screen),
        };

        try {
          const result = await this.orchestrator.executeQuality(formId, dto, tier, {
            ownerUserId: ownerUserId ?? undefined,
          });
          evalResults.push(qualityLevelToScore(result.level));
        } catch (err) {
          this.logger.warn(
            `Post-submit quality eval skipped for screen ${pair.screenId}: ${err instanceof Error ? err.message : String(err)}`,
          );
          break;
        }
      }

      const score =
        evalResults.length > 0
          ? Math.round(
              evalResults.reduce((a, b) => a + b, 0) / evalResults.length,
            )
          : 50;

      await this.prisma.formResponse.update({
        where: { id: responseId },
        data: { qualityScore: score, status: 'PROCESSED' },
      });

      this.logger.log(
        `Scored response ${responseId} via orchestrator: ${score}/100 (${evalResults.length} screens)`,
      );
    } catch (err) {
      await this.prisma.formResponse.update({
        where: { id: responseId },
        data: { status: 'FAILED' },
      });
      throw err;
    }
  }
}
