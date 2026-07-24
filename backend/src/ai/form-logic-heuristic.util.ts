/**
 * Rule-based branching when NVIDIA NIM is unavailable or returns invalid JSON.
 * Mirrors frontend `buildLocalAiLogicSuggestion` / `getSuggestedFlowLogic` behavior.
 */

export type LogicConnection = {
  from: number;
  to: number;
  kind: 'next' | 'if' | 'end';
};

export type LogicCondition = {
  id: string;
  sourceScreenId: number;
  fieldId: string;
  operator: string;
  value: string;
};

export type LogicIfRule = {
  id: string;
  thenScreenId: number;
  conditions: LogicCondition[];
};

export type LogicIfRulesEdge = {
  rules: LogicIfRule[];
  elseScreenId: number;
};

export type FormLogicGraph = {
  connections: LogicConnection[];
  ifRulesByEdge: Record<string, LogicIfRulesEdge>;
  showIfByScreenId: Record<string, never>;
};

export type LogicScreenInput = {
  id: number;
  label: string;
  type: string;
};

const BRANCHING_LABELS = new Set([
  'Single',
  'Multiple',
  'Media',
  'Images',
  'Rating',
  'Date',
  'Time',
  'Short text',
  'Long text',
  'Contact',
  'Address',
  'Work Info',
]);

function logicEdgeKey(from: number, to: number): string {
  return `${from}-${to}`;
}

function fieldIdForScreenLabel(label: string): string {
  if (label === 'Single' || label === 'Multiple' || label === 'Media') {
    return 'multiple-choice';
  }
  if (label === 'Rating') return 'rating';
  if (label === 'Date') return 'date';
  if (label === 'Time') return 'time';
  if (label === 'Long text') return 'long-text';
  if (label === 'Contact') return 'contact';
  if (label === 'Address') return 'address';
  if (label === 'Work Info') return 'work';
  return 'short-text';
}

function operatorForLabel(label: string): { operator: string; value: string } {
  if (label === 'Rating') return { operator: 'gte', value: '4' };
  return { operator: 'is_not_empty', value: '' };
}

function connectionKindForPair(
  from: LogicScreenInput,
  to: LogicScreenInput,
): LogicConnection['kind'] {
  if (from.type === 'intro' && to.type === 'end') return 'next';
  if (from.type === 'content' && to.type === 'end') return 'end';
  return 'next';
}

function supportsBranching(screen: LogicScreenInput): boolean {
  return screen.type === 'content' && BRANCHING_LABELS.has(screen.label);
}

export function buildHeuristicFormLogic(context: {
  screens: LogicScreenInput[];
  contentScreens: LogicScreenInput[];
}): FormLogicGraph {
  const intro = context.screens.find((s) => s.type === 'intro');
  const end = context.screens.find((s) => s.type === 'end');
  const flow: LogicScreenInput[] = [
    ...(intro ? [intro] : []),
    ...context.contentScreens,
    ...(end ? [end] : []),
  ];

  if (flow.length < 2) {
    return { connections: [], ifRulesByEdge: {}, showIfByScreenId: {} };
  }

  const connections: LogicConnection[] = [];
  const ifRulesByEdge: Record<string, LogicIfRulesEdge> = {};

  for (let i = 0; i < flow.length - 1; i += 1) {
    const fromScreen = flow[i];
    const defaultTo = flow[i + 1];
    const destinations = flow.slice(i + 1);
    const elseScreenId = defaultTo.id;
    const altDest =
      destinations.length >= 2 ? destinations[1].id : elseScreenId;

    const useIfBranch =
      supportsBranching(fromScreen) &&
      altDest !== elseScreenId &&
      destinations.length >= 2;

    if (useIfBranch) {
      const { operator, value } = operatorForLabel(fromScreen.label);
      const ruleId = `rule-h-${fromScreen.id}-${altDest}`;
      const condId = `cond-h-${fromScreen.id}`;
      connections.push({
        from: fromScreen.id,
        to: altDest,
        kind: 'if',
      });
      ifRulesByEdge[logicEdgeKey(fromScreen.id, altDest)] = {
        rules: [
          {
            id: ruleId,
            thenScreenId: altDest,
            conditions: [
              {
                id: condId,
                sourceScreenId: fromScreen.id,
                fieldId: fieldIdForScreenLabel(fromScreen.label),
                operator,
                value,
              },
            ],
          },
        ],
        elseScreenId,
      };
    } else {
      connections.push({
        from: fromScreen.id,
        to: defaultTo.id,
        kind: connectionKindForPair(fromScreen, defaultTo),
      });
    }
  }

  return { connections, ifRulesByEdge, showIfByScreenId: {} };
}

/**
 * Repair an LLM-generated graph instead of discarding it: drop edges/rules
 * that reference unknown screens, then guarantee coverage — every screen in
 * the natural order has an outgoing edge (appending linear `next`/`end`
 * edges for orphans) so the runner can always walk intro → … → end.
 */
export function repairLogicGraph(
  graph: FormLogicGraph,
  screens: LogicScreenInput[],
  contentScreens: LogicScreenInput[],
): FormLogicGraph {
  const intro = screens.find((s) => s.type === 'intro');
  const end = screens.find((s) => s.type === 'end');
  const flow: LogicScreenInput[] = [
    ...(intro ? [intro] : []),
    ...contentScreens,
    ...(end ? [end] : []),
  ];
  const validIds = new Set(flow.map((s) => String(s.id)));
  const contentIds = new Set(contentScreens.map((s) => String(s.id)));

  const connections = (graph.connections ?? []).filter(
    (edge) => validIds.has(String(edge.from)) && validIds.has(String(edge.to)),
  );

  const ifRulesByEdge: Record<string, LogicIfRulesEdge> = {};
  for (const [key, ruleSet] of Object.entries(graph.ifRulesByEdge ?? {})) {
    const [fromStr] = key.split('-');
    if (!contentIds.has(fromStr)) continue;
    const rules = (ruleSet.rules ?? []).filter((rule) =>
      (rule.conditions ?? []).every(
        (cond) =>
          cond.sourceScreenId == null ||
          contentIds.has(String(cond.sourceScreenId)),
      ),
    );
    if (rules.length === 0) continue;
    ifRulesByEdge[key] = { ...ruleSet, rules };
  }

  const hasOutgoing = new Set(connections.map((edge) => String(edge.from)));
  for (let i = 0; i < flow.length - 1; i += 1) {
    const from = flow[i];
    if (hasOutgoing.has(String(from.id))) continue;
    const to = flow[i + 1];
    connections.push({
      from: from.id,
      to: to.id,
      kind: connectionKindForPair(from, to),
    });
    hasOutgoing.add(String(from.id));
  }

  return {
    connections,
    ifRulesByEdge,
    showIfByScreenId: graph.showIfByScreenId ?? {},
  };
}

export function buildLinearFormLogic(
  screens: LogicScreenInput[],
): FormLogicGraph {
  const connections: LogicConnection[] = [];
  for (let i = 0; i < screens.length - 1; i += 1) {
    const from = screens[i];
    const to = screens[i + 1];
    connections.push({
      from: from.id,
      to: to.id,
      kind: connectionKindForPair(from, to),
    });
  }
  return { connections, ifRulesByEdge: {}, showIfByScreenId: {} };
}
