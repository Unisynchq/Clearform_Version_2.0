import { resolveQuestionTextFromScreen } from '../snapshot-screen.util';

function textValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
  }
  return '';
}

const MAX_LOGIC_SUMMARY_EDGES = 15;

/**
 * Compact, human-readable rendering of the form's branching so the model
 * knows where this question sits in the flow (e.g. `Q3 --if rules--> Q5`).
 */
export function buildLogicSummary(
  snapshot: Record<string, unknown>,
  screens: Record<string, unknown>[],
  labelFor: (screen: Record<string, unknown>) => string | undefined = resolveQuestionTextFromScreen,
): string | undefined {
  const connections =
    (snapshot.logicConnections as Record<string, unknown>[]) ?? [];
  if (!Array.isArray(connections) || connections.length === 0) {
    return undefined;
  }
  const ifRules = (snapshot.logicIfRulesByEdge ?? {}) as Record<
    string,
    { rules?: unknown[]; elseScreenId?: unknown }
  >;
  const screenLabel = (id: unknown): string => {
    const screen = screens.find((s) => textValue(s.id) === textValue(id));
    const label = screen ? labelFor(screen) : undefined;
    return label ? `"${label.slice(0, 60)}"` : `screen ${textValue(id)}`;
  };

  const lines = connections.slice(0, MAX_LOGIC_SUMMARY_EDGES).map((edge) => {
    const kind = textValue(edge.kind, 'next');
    const from = screenLabel(edge.from);
    const to = edge.to == null ? 'end' : screenLabel(edge.to);
    const edgeKey = `${textValue(edge.from)}-${textValue(edge.to)}`;
    const rules = ifRules[edgeKey];
    const ruleCount = Array.isArray(rules?.rules) ? rules.rules.length : 0;
    if (kind === 'if' || ruleCount > 0) {
      return `${from} --if (${ruleCount} rule${ruleCount === 1 ? '' : 's'})--> ${to}`;
    }
    if (kind === 'end') return `${from} --end`;
    return `${from} --> ${to}`;
  });
  if (connections.length > MAX_LOGIC_SUMMARY_EDGES) {
    lines.push(`… ${connections.length - MAX_LOGIC_SUMMARY_EDGES} more edges`);
  }
  return lines.join('\n');
}
