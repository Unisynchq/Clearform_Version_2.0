import { Injectable } from '@nestjs/common';
import { copyVariants, normalizeCopy } from './doctrine/copy.registry';
import type { FormLogicGraph } from './form-logic-heuristic.util';
import type { FormContext } from './form-context.types';
import { parseSnapshotScreens } from '../responses/answer-format.util';
import { hasKeyboardMashSegment } from './ai-quality-rules.util';
import type { QualityResult } from './ai.service.types';
import { isPerfectionTip } from './quality/respondent-copy.util';
import {
  isMetaGuidanceLeak,
  isMetaFollowUpLeak,
  isParaphraseOnlyGreen,
  isRedundantTopicCoaching,
  isRespondentNameSalutation,
  messageGroundedInAnswer,
} from './quality/respondent-copy.util';

export type QualityValidationInput = {
  level: string;
  message: string;
  failedIds: string[];
  suggestions?: string[];
  followUpQuestion?: string | null;
  answerText?: string;
  questionText?: string;
};

export type InsightsValidationInput = {
  summaryText: string;
  priorityTitle: string;
  priorityBody: string;
  topIssueCategory?: string;
};

export type OverviewInsightInput = {
  message: string;
  actionableStep?: {
    action: 'improve_screen' | 'open_logic' | 'view_analytics';
    screenId?: number | string;
    screenLabel?: string;
    dropPercent?: number;
    estimatedGain?: number;
    builderTab?: string;
  };
};

function textSimilarity(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wb = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (wa.size === 0 || wb.size === 0) return 0;
  let overlap = 0;
  for (const w of wa) {
    if (wb.has(w)) overlap += 1;
  }
  return overlap / Math.max(wa.size, wb.size);
}

function screenIdsFromContext(context: FormContext): Set<string> {
  const snapshotIds = parseSnapshotScreens(context.snapshot)
    .map((screen) => screen.id)
    .filter((id): id is string | number => id != null);
  if (snapshotIds.length > 0) {
    return new Set(snapshotIds.map(String));
  }
  return new Set(context.screens.map((s) => String(s.screenId)));
}

function labelsFromContext(context: FormContext): string[] {
  return context.screenLabels.map((l) => l.toLowerCase());
}

@Injectable()
export class GroundingValidatorService {
  deriveConfidencePercent(
    responseCount: number,
    validationPassed: boolean,
  ): number | null {
    if (responseCount < 10) return null;
    const base = responseCount >= 25 ? 85 : responseCount >= 15 ? 72 : 58;
    return validationPassed ? base : Math.max(40, base - 15);
  }

  validateQualityResult(result: QualityValidationInput): {
    ok: boolean;
    reason?: string;
  } {
    if (!['green', 'amber', 'red'].includes(result.level)) {
      return { ok: false, reason: 'invalid level' };
    }
    if (!result.message?.trim()) {
      return { ok: false, reason: 'empty message' };
    }
    if (isMetaGuidanceLeak(result.message)) {
      return { ok: false, reason: 'meta guidance leak in respondent message' };
    }
    if (isRespondentNameSalutation(result.message)) {
      return { ok: false, reason: 'respondent name salutation in message' };
    }
    const answerText = result.answerText?.trim() ?? '';
    const questionText = result.questionText?.trim() ?? '';
    if (
      answerText &&
      result.level === 'green' &&
      isParaphraseOnlyGreen(result.message, answerText)
    ) {
      return { ok: false, reason: 'green message is paraphrase only' };
    }
    if (
      answerText &&
      result.level === 'amber' &&
      isRedundantTopicCoaching(result.message, answerText, questionText)
    ) {
      return { ok: false, reason: 'redundant topic coaching' };
    }
    if (
      result.followUpQuestion &&
      isMetaFollowUpLeak(result.followUpQuestion)
    ) {
      return { ok: false, reason: 'meta followUp question' };
    }
    // Tips must match THIS question — ban event-style "liked most" on unrelated asks.
    const tipBlob = [
      result.message,
      ...(Array.isArray(result.suggestions) ? result.suggestions : []),
      result.followUpQuestion ?? '',
    ]
      .join(' ')
      .toLowerCase();
    const qLower = questionText.toLowerCase();
    const asksLikedMost =
      /\b(liked most|like the most|favorite|favourite|best part)\b/.test(
        qLower,
      );
    if (
      !asksLikedMost &&
      /\b(liked most|like the most|favorite part|favourite|what you liked)\b/.test(
        tipBlob,
      )
    ) {
      return {
        ok: false,
        reason: 'off-topic liked-most tip for this question',
      };
    }
    if (
      answerText &&
      result.message &&
      !messageGroundedInAnswer(result.message, answerText) &&
      result.level !== 'red'
    ) {
      return { ok: false, reason: 'message cites content not in answer' };
    }
    if (!Array.isArray(result.failedIds)) {
      return { ok: false, reason: 'failedIds must be array' };
    }
    const failCount = result.failedIds.length;
    if (result.level === 'green' && failCount > 0) {
      return { ok: false, reason: 'green level with failedIds' };
    }
    if (result.level === 'amber' && failCount === 0) {
      return { ok: false, reason: 'amber level without failedIds' };
    }
    if (result.level === 'red' && failCount === 0) {
      return { ok: false, reason: 'red level without failedIds' };
    }
    if (result.level === 'green') {
      const tips = Array.isArray(result.suggestions)
        ? result.suggestions.filter((s) => typeof s === 'string' && s.trim())
        : [];
      const msg = result.message?.trim() ?? '';
      if (/not configured/i.test(msg)) {
        return { ok: false, reason: 'respondent-facing not-configured copy' };
      }
      // Green may include exactly one near-complete perfection tip (2/3 facets rule).
      if (tips.length > 1) {
        return {
          ok: false,
          reason: 'green level allows at most one suggestion',
        };
      }
      if (tips.length === 1 && !isPerfectionTip(tips[0])) {
        return {
          ok: false,
          reason: 'green suggestion is not a perfection tip',
        };
      }
      if (/great response|clear and detailed/i.test(result.message ?? '')) {
        return { ok: false, reason: 'green message is too generic' };
      }
      const answerText = result.answerText?.trim() ?? '';
      const isCannedGreen = copyVariants('green.default')
        .map(normalizeCopy)
        .includes(normalizeCopy(msg));
      if (isCannedGreen && answerText && hasKeyboardMashSegment(answerText)) {
        return { ok: false, reason: 'green on keyboard mash answer' };
      }
    }
    return { ok: true };
  }

  validateLogicGraph(
    graph: FormLogicGraph,
    context: FormContext,
  ): { ok: boolean; reason?: string } {
    const validIds = screenIdsFromContext(context);
    const contentIds = new Set(context.contentScreens.map((s) => String(s.id)));

    if (!Array.isArray(graph.connections) || graph.connections.length === 0) {
      return { ok: false, reason: 'no connections' };
    }

    for (const edge of graph.connections) {
      if (!validIds.has(String(edge.from)) || !validIds.has(String(edge.to))) {
        return { ok: false, reason: 'connection references unknown screenId' };
      }
    }

    const rules = graph.ifRulesByEdge ?? {};
    for (const [key, ruleSet] of Object.entries(rules)) {
      const [fromStr] = key.split('-');
      if (!contentIds.has(fromStr)) {
        return { ok: false, reason: 'ifRule on non-content screen' };
      }
      const rs = ruleSet as {
        rules?: {
          conditions?: { sourceScreenId?: number; fieldId?: string }[];
        }[];
      };
      for (const rule of rs.rules ?? []) {
        for (const cond of rule.conditions ?? []) {
          if (
            cond.sourceScreenId != null &&
            !contentIds.has(String(cond.sourceScreenId))
          ) {
            return { ok: false, reason: 'condition references unknown screen' };
          }
        }
      }
    }

    return { ok: true };
  }

  validateInsights(
    input: InsightsValidationInput,
    context: FormContext,
  ): { ok: boolean; reason?: string } {
    if (!input.summaryText?.trim() || !input.priorityBody?.trim()) {
      return { ok: false, reason: 'missing summary or priority body' };
    }
    if (input.summaryText.trim() === input.priorityBody.trim()) {
      return { ok: false, reason: 'summaryText equals priorityBody' };
    }
    if (textSimilarity(input.summaryText, input.priorityBody) >= 0.65) {
      return { ok: false, reason: 'summary and priority too similar' };
    }
    const labelCheck = this.citedLabelsExist(input.summaryText, context);
    if (!labelCheck.ok) return labelCheck;
    return { ok: true };
  }

  validateOverviewInsight(
    input: OverviewInsightInput,
    context: FormContext,
  ): { ok: boolean; reason?: string } {
    if (!input.message?.trim()) {
      return { ok: false, reason: 'empty message' };
    }
    const labelCheck = this.citedLabelsExist(input.message, context);
    if (!labelCheck.ok) return labelCheck;

    const step = input.actionableStep;
    if (step?.screenId != null) {
      const ids = screenIdsFromContext(context);
      if (!ids.has(String(step.screenId))) {
        return { ok: false, reason: 'actionableStep screenId not in snapshot' };
      }
    }
    return { ok: true };
  }

  private citedLabelsExist(
    text: string,
    context: FormContext,
  ): { ok: boolean; reason?: string } {
    const lower = text.toLowerCase();
    const labels = labelsFromContext(context);
    if (labels.length === 0) return { ok: true };

    const qPattern = /Q\d+/gi;
    const qMatches = text.match(qPattern);
    if (qMatches) {
      for (const q of qMatches) {
        const idx = parseInt(q.slice(1), 10) - 1;
        if (idx >= 0 && idx < context.screens.length) continue;
        return { ok: false, reason: `cites unknown step ${q}` };
      }
    }

    const citedLabel = labels.find((l) => l.length > 3 && lower.includes(l));
    if (!citedLabel) return { ok: true };

    const known = labels.some((l) => lower.includes(l));
    if (!known && labels.length > 0) {
      return { ok: false, reason: 'cites unknown screen label' };
    }
    return { ok: true };
  }
}
