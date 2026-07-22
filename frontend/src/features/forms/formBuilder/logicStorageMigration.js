import { logicEdgeKey } from '@/features/forms/utils/logicEngine';

/** Migrate legacy per-screen rules into per-connection keys. */
export function migrateLogicIfRulesToEdges(byScreen = {}) {
  const byEdge = {};
  const elseByScreen = {};
  for (const [fromKey, data] of Object.entries(byScreen)) {
    const from = Number(fromKey);
    if (!Number.isFinite(from)) continue;
    if (data.elseScreenId != null) elseByScreen[from] = data.elseScreenId;
    for (const rule of data.rules ?? []) {
      if (rule.thenScreenId == null) continue;
      const key = logicEdgeKey(from, rule.thenScreenId);
      if (!byEdge[key]) {
        byEdge[key] = { rules: [], elseScreenId: data.elseScreenId ?? null };
      }
      byEdge[key].rules.push({
        ...rule,
        thenScreenId: rule.thenScreenId,
        conditions: (rule.conditions ?? []).map((c) => ({ ...c })),
      });
    }
  }
  return { byEdge, elseByScreen };
}

/** Copy legacy per-screen else into edges that do not have their own else yet. */
export function mergeLegacyElseIntoEdges(byEdge = {}, elseByScreen = {}) {
  const next = { ...byEdge };
  for (const [fromKey, elseId] of Object.entries(elseByScreen)) {
    const from = Number(fromKey);
    if (!Number.isFinite(from) || elseId == null) continue;
    for (const [key, data] of Object.entries(next)) {
      const edgeFrom = Number(String(key).split('-')[0]);
      if (edgeFrom !== from || data?.elseScreenId != null) continue;
      next[key] = { ...data, elseScreenId: elseId };
    }
  }
  return next;
}
