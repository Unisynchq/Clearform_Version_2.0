/**
 * Normalize and apply AI logic API payloads to the same structures used in manual mode.
 */

import {
  buildLogicQuestionOptions,
  findLogicQuestionOption,
  screenSupportsIfThenLogic,
} from '@/features/forms/constants/logicFieldCatalog';
import { LOGIC_EDGE_KIND } from '@/features/forms/constants/logicEdgeKinds';
import { getSuggestedFlowLogic } from '@/features/forms/utils/logicCardDefaults';
import { logicEdgeKey } from '@/features/forms/utils/logicEngine';

const VALID_EDGE_KINDS = new Set(Object.values(LOGIC_EDGE_KIND));

const normalizeCondition = (condition, questionOptions, fromScreenId) => {
  if (!condition || typeof condition !== 'object') return null;
  if (condition.sourceScreenId != null) {
    const opt = findLogicQuestionOption(
      questionOptions,
      condition.sourceScreenId,
      condition.fieldId
    );
    if (opt) return { ...condition };
  }
  const match =
    questionOptions.find((o) => Number(o.sourceScreenId) === Number(fromScreenId)) ??
    questionOptions.find((o) => o.fieldId === condition.fieldId) ??
    questionOptions[0];
  if (!match) return condition;
  return {
    ...condition,
    sourceScreenId: match.sourceScreenId,
    fieldId: match.fieldId,
  };
};

const normalizeRule = (rule, questionOptions, fromScreenId, forcedThenScreenId) => {
  if (!rule || typeof rule !== 'object') return null;
  const thenScreenId =
    forcedThenScreenId ?? rule.thenScreenId ?? rule.then_screen_id ?? null;
  const conditions = (rule.conditions ?? [])
    .map((c) => normalizeCondition(c, questionOptions, fromScreenId))
    .filter(Boolean);
  if (!conditions.length) return null;
  return {
    id: rule.id ?? `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    thenScreenId: thenScreenId != null ? Number(thenScreenId) : null,
    conditions,
  };
};

/**
 * @typedef {object} AiLogicPayload
 * @property {Array<{ from: number, to: number, kind?: string }>} [connections]
 * @property {Record<string, { rules: object[], elseScreenId?: number|null }>} [ifRulesByEdge]
 * @property {Record<number, object[]>} [showIfByScreenId]
 */

/**
 * Coerce API / stub payload into builder-safe logic state.
 *
 * @param {AiLogicPayload} payload
 * @param {{ screens: object[], questionOptions: object[] }} context
 */
export function normalizeAiLogicPayload(payload, context) {
  const { screens, questionOptions } = context;
  const screenIds = new Set(screens.map((s) => s.id));

  const connections = (payload?.connections ?? [])
    .map((c) => {
      const from = Number(c.from);
      const to = Number(c.to);
      if (!screenIds.has(from) || !screenIds.has(to)) return null;
      const kind = c.kind ?? LOGIC_EDGE_KIND.next;
      if (!VALID_EDGE_KINDS.has(kind)) return null;
      return { from, to, kind };
    })
    .filter(Boolean);

  const ifRulesByEdge = {};
  const rawRules = payload?.ifRulesByEdge ?? payload?.if_rules_by_edge ?? {};
  for (const [key, value] of Object.entries(rawRules)) {
    const sep = key.indexOf('-');
    if (sep < 0) continue;
    const from = Number(key.slice(0, sep));
    const to = Number(key.slice(sep + 1));
    if (!screenIds.has(from) || !screenIds.has(to)) continue;

    const rules = (value?.rules ?? [])
      .map((r) => normalizeRule(r, questionOptions, from, to))
      .filter(Boolean);
    if (!rules.length) continue;

    const elseRaw = value?.elseScreenId ?? value?.else_screen_id;
    const elseScreenId =
      elseRaw != null && screenIds.has(Number(elseRaw)) ? Number(elseRaw) : null;

    ifRulesByEdge[logicEdgeKey(from, to)] = { rules, elseScreenId };
  }

  const showIfByScreenId = payload?.showIfByScreenId ?? payload?.show_if_by_screen_id ?? null;

  return { connections, ifRulesByEdge, showIfByScreenId };
}

/**
 * Apply normalized AI logic to form builder state (same shapes as manual mode).
 *
 * @param {{ screens: object[] }} context
 * @param {AiLogicPayload} payload
 */
export function applyAiLogicPayload(context, payload) {
  const questionOptions =
    context.questionOptions ??
    buildLogicQuestionOptions({
      screens: context.screens,
      getQuestionText: context.getQuestionText,
      welcomeInputType: context.welcomeInputType,
      welcomeHidden: context.welcomeHidden,
      introTitle: context.introTitle,
    });

  const normalized = normalizeAiLogicPayload(payload, {
    screens: context.screens,
    questionOptions,
  });

  let nextScreens = context.screens;
  if (normalized.showIfByScreenId && typeof normalized.showIfByScreenId === 'object') {
    nextScreens = context.screens.map((s) => {
      const raw = normalized.showIfByScreenId[s.id];
      if (!raw?.length) return s;
      const conditions = raw
        .map((c) => normalizeCondition(c, questionOptions, s.id))
        .filter(Boolean);
      if (!conditions.length) return s;
      return {
        ...s,
        config: { ...(s.config ?? {}), showIfConditions: conditions },
      };
    });
  }

  return {
    logicConnections: normalized.connections,
    logicIfRulesByEdge: normalized.ifRulesByEdge,
    screens: nextScreens,
  };
}

const getDestinationOptions = (screens, fromScreenId) => {
  const end = screens.find((s) => s.type === 'end');
  const destinations = screens
    .filter((s) => s.type === 'content' && s.id !== fromScreenId)
    .map((s) => ({
      id: s.id,
      label: s.name || s.label || 'Screen',
    }));
  if (end) destinations.push({ id: end.id, label: 'End screen' });
  return destinations;
};

const connectionKindForPair = (fromScreen, toScreen) => {
  if (fromScreen?.type === 'intro' && toScreen?.type === 'end') return LOGIC_EDGE_KIND.next;
  if (fromScreen?.type === 'content' && toScreen?.type === 'end') return LOGIC_EDGE_KIND.end;
  return LOGIC_EDGE_KIND.next;
};

/**
 * Local stub: build suggested connections + if-rules from the form (until API ships).
 * Uses the same `getSuggestedFlowLogic` heuristics as manual if/then defaults.
 */
export function buildLocalAiLogicSuggestion(context) {
  const { screens, contentScreens } = context;
  const intro = screens.find((s) => s.type === 'intro');
  const end = screens.find((s) => s.type === 'end');
  const flow = [...(intro ? [intro] : []), ...contentScreens, ...(end ? [end] : [])];
  if (flow.length < 2) {
    return { connections: [], ifRulesByEdge: {} };
  }

  const questionOptions =
    context.questionOptions ??
    buildLogicQuestionOptions({
      screens,
      getQuestionText: context.getQuestionText,
      welcomeInputType: context.welcomeInputType,
      welcomeHidden: context.welcomeHidden,
      introTitle: context.introTitle,
    });

  const connections = [];
  const ifRulesByEdge = {};

  for (let i = 0; i < flow.length - 1; i += 1) {
    const fromScreen = flow[i];
    const defaultTo = flow[i + 1];
    const destinations = getDestinationOptions(screens, fromScreen.id);
    const suggested = getSuggestedFlowLogic(
      fromScreen.label,
      questionOptions,
      destinations,
      end?.id ?? null,
      fromScreen.id
    );

    const branchRule = suggested.rules?.[0];
    const branchTo = branchRule?.thenScreenId;
    const elseTo = suggested.elseScreenId ?? defaultTo.id;
    const useIfBranch =
      screenSupportsIfThenLogic(fromScreen) &&
      branchTo != null &&
      Number(branchTo) !== Number(defaultTo.id) &&
      (branchRule?.conditions?.length ?? 0) > 0;

    if (useIfBranch) {
      connections.push({
        from: fromScreen.id,
        to: Number(branchTo),
        kind: LOGIC_EDGE_KIND.if,
      });
      ifRulesByEdge[logicEdgeKey(fromScreen.id, branchTo)] = {
        rules: suggested.rules.map((r) => ({
          ...r,
          thenScreenId: Number(branchTo),
          conditions: r.conditions.map((c) =>
            normalizeCondition(c, questionOptions, fromScreen.id)
          ),
        })),
        elseScreenId: elseTo != null ? Number(elseTo) : Number(defaultTo.id),
      };
    } else {
      connections.push({
        from: fromScreen.id,
        to: defaultTo.id,
        kind: connectionKindForPair(fromScreen, defaultTo),
      });
    }
  }

  return { connections, ifRulesByEdge };
}
