import {
  classifyQualityViolation,
  resolveViolationLevelHint,
  violationKindToFailedIds,
} from '../../ai-quality-rules.util';
import {
  buildEvalPromptFromContext,
  buildViolationContextBlock,
  finalizeQualityResult,
  parseQualityJson,
} from '../../ai-quality.util';
import { normalizeQualityOptions } from '../../ai-quality-rules.util';
import { QUALITY_TIER_CONFIG } from '../quality-tier.config';
import { suggestionSimilarity } from './anti-repeat.util';
import {
  logQualityEvalBreadcrumb,
} from './quality-pipeline.util';
import type {
  QualityPipelineContext,
  QualityPipelineDeps,
  QualityStageOutcome,
} from './quality-pipeline.types';
import type { QualitySessionMemory } from '../quality-session-memory.service';

function aggregateSessionShown(session: QualitySessionMemory): string[] {
  const shown: string[] = [];
  for (const screen of Object.values(session.screens)) {
    shown.push(...(screen.shownMessages ?? []), ...(screen.shownSuggestions ?? []));
  }
  return shown;
}

export function buildSessionPromptBlocks(
  session: QualitySessionMemory | null,
  screenId: string | number,
  depth: 'counts' | 'full',
): string {
  const screen = session?.screens[String(screenId)];
  if (!session || !screen) return '';

  const blocks: string[] = [];
  const formWideShown = aggregateSessionShown(session);
  if (formWideShown.length) {
    blocks.push(
      `[ALREADY SHOWN THIS SESSION — never repeat these messages or suggestions on any question, in wording or in substance]\n` +
        formWideShown.map((s) => `- ${s}`).join('\n'),
    );
  }

  const violationEntries = Object.entries(session.totals).filter(
    ([kind, count]) => kind !== 'reds' && (count ?? 0) > 0,
  );

  const verdicts = screen?.verdicts ?? [];
  if (verdicts.length > 0 && depth === 'full') {
    const trajectory = verdicts.join(' → ');
    const improved =
      verdicts.length >= 2 &&
      (verdicts[verdicts.length - 2] === 'amber' ||
        verdicts[verdicts.length - 2] === 'red') &&
      verdicts[verdicts.length - 1] !== 'red';
    const priorAnswerLine = screen?.lastAnswerExcerpt
      ? `\nWhat they wrote last time on this question: "${screen.lastAnswerExcerpt}"\nCompare it to what they've written now — name the specific thing that changed or is still missing, don't re-grade from scratch as if this were a first attempt.`
      : '';
    blocks.push(
      `[ANSWER TRAJECTORY ON THIS QUESTION]\n` +
        `prior verdicts on this screen: ${trajectory} → evaluating now.` +
        priorAnswerLine +
        '\n' +
        (improved
          ? 'If the answer materially improved, acknowledge it briefly (e.g. "Much clearer than before").'
          : 'Coach on what is still missing; do not repeat prior suggestions.'),
    );
  }

  if (violationEntries.length) {
    if (depth === 'full') {
      const perScreen = Object.entries(session.screens)
        .filter(([, s]) => Object.keys(s.violations).length > 0)
        .map(
          ([id, s]) =>
            `- screen ${id}: ${Object.entries(s.violations)
              .map(([kind, count]) => `${kind} ×${count}`)
              .join(', ')}`,
        )
        .join('\n');
      blocks.push(
        `[RESPONDENT BEHAVIOR THIS SESSION]\n${perScreen}\n` +
          `When a violation repeats, reference it conversationally (e.g. "Looks like random characters again — earlier answers had the same problem."). Stay respectful.`,
      );
    } else {
      blocks.push(
        `[RESPONDENT BEHAVIOR THIS SESSION]\n` +
          violationEntries
            .map(([kind, count]) => `- ${kind}: ${count}`)
            .join('\n'),
      );
    }
  }
  return blocks.length ? `\n\n${blocks.join('\n\n')}` : '';
}

/** Single doctrine-driven LLM eval — no separate nudge service. */
export async function llmStage(
  ctx: QualityPipelineContext,
  deps: QualityPipelineDeps,
): Promise<QualityStageOutcome> {
  const { enrichedDto, text, intent, tier, context, formId, dto } = ctx;
  const tierConfig = QUALITY_TIER_CONFIG[tier];
  const violationKind =
    ctx.violationKind !== 'none'
      ? ctx.violationKind
      : classifyQualityViolation(
          text,
          enrichedDto.questionText,
          enrichedDto.helperText,
        );

  let memoryContext = '';
  if (formId && tierConfig.cleoMemory) {
    try {
      const memoryChunks = await deps.memory.retrieveSimilar(
        formId,
        `${enrichedDto.questionText ?? ''} ${text}`.trim(),
        3,
        tier,
        {
          screenId: dto.screenId,
          chunkTypes: ['quality_feedback', 'question_pattern'],
        },
      );
      memoryContext = memoryChunks.map((c) => c.content).join('\n---\n');
    } catch (err) {
      deps.logger.warn(
        `Quality memory retrieval skipped (degraded): ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  const repeatViolation =
    violationKind !== 'none' &&
    ((ctx.session?.totals[violationKind] ?? 0) > 0 ||
      (ctx.session?.screens[String(dto.screenId)]?.violations[violationKind] ??
        0) > 0);

  // Post-hoc dedupeAgainstSession (run by the orchestrator after this stage
  // returns) falls back to canned copy-registry text whenever the LLM's
  // output is too similar to something already shown on this screen. That
  // fallback should be a last resort, not the default outcome of a
  // similarity false-positive — so when a fresh, grounded result still looks
  // like a repeat, spend one extra attempt asking for a materially different
  // phrasing before accepting it. Scoped to this question only, matching the
  // (also screen-scoped) post-hoc check.
  const screenHistory = ctx.session?.screens[String(dto.screenId)];
  const screenShown = [
    ...(screenHistory?.shownMessages ?? []),
    ...(screenHistory?.shownSuggestions ?? []),
  ];
  const looksLikeRepeat = (candidate: string): boolean =>
    screenShown.some((seen) => suggestionSimilarity(candidate, seen) >= 0.8);
  let usedRepeatRetry = false;

  const doctrinePrompt = deps.doctrine.getDoctrineSlim('response-quality', intent);
  const maxAttempts = tierConfig.llmAttempts;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const strict = attempt > 0;
    try {
      const userPrompt =
        buildEvalPromptFromContext(
          enrichedDto,
          normalizeQualityOptions(ctx.effectiveOptions),
          context,
          memoryContext,
          intent,
          deps.doctrine.getIntentDoctrine(intent),
        ) +
        buildViolationContextBlock({
          violationKind,
          levelHint: resolveViolationLevelHint(violationKind, text),
          failedIds: violationKindToFailedIds(violationKind),
          repeatViolation,
        }) +
        buildSessionPromptBlocks(
          ctx.session,
          dto.screenId,
          tierConfig.sessionMemoryDepth,
        );
      const content = await deps.llm.completion({
        task: 'fast',
        tier,
        formId,
        ownerUserId: ctx.ownerUserId,
        messages: [
          { role: 'system', content: doctrinePrompt },
          {
            role: 'user',
            content: strict
              ? `${userPrompt}\n\nSTRICT: Return valid JSON only. suggestions must be concrete.`
              : userPrompt,
          },
        ],
        maxTokens: tierConfig.maxTokens,
        temperature: tierConfig.temperature,
        jsonMode: true,
        // Free OpenRouter needs more headroom; pro Gemini stays snappy.
        timeoutMs: tier === 'pro' ? 5_000 : 8_000,
        deadlineMs: tier === 'pro' ? 6_000 : 14_000,
        maxFallbackModels: tier === 'pro' ? 1 : 2,
      });
      const parsed = content ? parseQualityJson(content) : null;
      if (!parsed) continue;

      const finalized = finalizeQualityResult(
        parsed,
        enrichedDto,
        context,
        tier,
        intent,
      );
      const grounded = deps.grounding.validateQualityResult({
        ...finalized,
        answerText: text,
        questionText: enrichedDto.questionText,
      });
      if (!grounded.ok) {
        deps.logger.warn(
          `Quality LLM grounding rejected attempt=${attempt} level=${finalized.level} reason=${grounded.reason ?? 'unknown'}`,
        );
        continue;
      }

      const candidateText = [finalized.message, ...(finalized.suggestions ?? [])]
        .filter(Boolean)
        .join(' ');
      if (
        !usedRepeatRetry &&
        screenShown.length &&
        candidateText &&
        looksLikeRepeat(candidateText)
      ) {
        usedRepeatRetry = true;
        try {
          const retryPrompt =
            `${userPrompt}\n\n` +
            `[AVOID REPEATING]\nYour previous draft was too similar to feedback already shown on this question:\n` +
            screenShown.map((s) => `- ${s}`).join('\n') +
            `\nRewrite it — same verdict logic, materially different phrasing and a different concrete detail to focus on.`;
          const retryContent = await deps.llm.completion({
            task: 'fast',
            tier,
            formId,
            ownerUserId: ctx.ownerUserId,
            messages: [
              { role: 'system', content: doctrinePrompt },
              { role: 'user', content: retryPrompt },
            ],
            maxTokens: tierConfig.maxTokens,
            temperature: Math.min(tierConfig.temperature + 0.2, 0.7),
            jsonMode: true,
            timeoutMs: tier === 'pro' ? 5_000 : 8_000,
            deadlineMs: tier === 'pro' ? 6_000 : 14_000,
            maxFallbackModels: 1,
          });
          const retryParsed = retryContent ? parseQualityJson(retryContent) : null;
          if (retryParsed) {
            const retryFinalized = finalizeQualityResult(
              retryParsed,
              enrichedDto,
              context,
              tier,
              intent,
            );
            const retryGrounded = deps.grounding.validateQualityResult({
              ...retryFinalized,
              answerText: text,
              questionText: enrichedDto.questionText,
            });
            const retryCandidateText = [
              retryFinalized.message,
              ...(retryFinalized.suggestions ?? []),
            ]
              .filter(Boolean)
              .join(' ');
            if (
              retryGrounded.ok &&
              retryCandidateText &&
              !looksLikeRepeat(retryCandidateText)
            ) {
              logQualityEvalBreadcrumb({
                formId,
                intent,
                level: retryFinalized.level,
                violationKind: violationKind === 'none' ? 'llm' : violationKind,
                tier,
              });
              return { result: retryFinalized, cache: true };
            }
          }
        } catch (err) {
          deps.logger.warn(`Quality LLM repeat-retry failed: ${err}`);
        }
        // Retry didn't produce anything fresher — fall through and return
        // the original result; the orchestrator's post-hoc dedupe is the
        // final safety net if it's still judged a repeat.
      }

      if (
        formId &&
        (finalized.level === 'green' || finalized.level === 'amber')
      ) {
        void deps.memory.storeChunk(
          formId,
          'quality_feedback',
          `Q: ${enrichedDto.questionText ?? ''}\nA: ${text.slice(0, 500)}\nLevel: ${finalized.level}`,
          {
            screenId: dto.screenId,
            level: finalized.level,
            intent,
          },
          tier,
        );
      }
      logQualityEvalBreadcrumb({
        formId,
        intent,
        level: finalized.level,
        violationKind: violationKind === 'none' ? 'llm' : violationKind,
        tier,
      });
      return { result: finalized, cache: true };
    } catch (err) {
      deps.logger.warn(`Quality LLM attempt failed: ${err}`);
    }
  }
  return null;
}
