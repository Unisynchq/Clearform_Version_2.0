import { LOGIC_EDGE_KIND } from '@/features/forms/formBuilder/logicEdgeModel';

export const LOGIC_EDGE_FAN_PX = 16;
/** Shared horizontal trunk before branches fan / merge (Typeform-style) */
export const LOGIC_IF_TRUNK_PX = 56;

/** Rebuild [intro, ...content, end] by following logic edges from intro; unreachable content keeps prior relative order. */
export function reorderScreensFromLogicConnections(screens, connections) {
  const intro = screens.find((s) => s.type === 'intro');
  const end = screens.find((s) => s.type === 'end');
  const content = screens.filter((s) => s.type === 'content');
  if (!intro || !end) return screens;

  const outgoing = new Map();
  for (const e of connections) {
    if (!outgoing.has(e.from)) outgoing.set(e.from, []);
    outgoing.get(e.from).push(e);
  }
  for (const edges of outgoing.values()) {
    edges.sort((a, b) => a.to - b.to || String(a.kind ?? '').localeCompare(String(b.kind ?? '')));
  }

  const pickPrimaryTo = (fromId) => {
    const resolved = (outgoing.get(fromId) ?? []).filter((e) => e.kind != null);
    if (!resolved.length) return null;
    const nextEdge = resolved.find((e) => e.kind === LOGIC_EDGE_KIND.next);
    return (nextEdge ?? resolved[0]).to;
  };

  const chainIds = [];
  let cur = intro.id;
  const visited = new Set();
  while (true) {
    const to = pickPrimaryTo(cur);
    if (to == null) break;
    if (to === end.id) break;
    if (visited.has(to)) break;
    visited.add(to);
    const s = screens.find((x) => x.id === to);
    if (!s || s.type !== 'content') break;
    chainIds.push(to);
    cur = to;
  }

  const inChain = new Set(chainIds);
  const contentIdOrder = content.map((s) => s.id);
  const orphanIds = contentIdOrder.filter((id) => !inChain.has(id));
  const newContentIds = [...chainIds, ...orphanIds];
  const byId = new Map(screens.map((s) => [s.id, s]));
  const newContent = newContentIds.map((id) => byId.get(id)).filter(Boolean);

  return [intro, ...newContent, end];
}

/** Group edges for fanning multiple connectors from/to the same node (stable sort). */
export function groupLogicConnectionsByFrom(connections) {
  const m = new Map();
  for (const c of connections) {
    if (!m.has(c.from)) m.set(c.from, []);
    m.get(c.from).push(c);
  }
  for (const arr of m.values()) {
    arr.sort((a, b) => a.to - b.to || String(a.kind ?? '').localeCompare(String(b.kind ?? '')));
  }
  return m;
}

export function groupLogicConnectionsByTo(connections) {
  const m = new Map();
  for (const c of connections) {
    if (!m.has(c.to)) m.set(c.to, []);
    m.get(c.to).push(c);
  }
  for (const arr of m.values()) {
    arr.sort((a, b) => a.from - b.from || String(a.kind ?? '').localeCompare(String(b.kind ?? '')));
  }
  return m;
}

export function logicConnectionEndpoints(c, byFrom, byTo, a, b) {
  const fromArr = byFrom.get(c.from) ?? [c];
  const fi = Math.max(0, fromArr.indexOf(c));
  const nF = fromArr.length;
  const dy0 = nF <= 1 ? 0 : (fi - (nF - 1) / 2) * LOGIC_EDGE_FAN_PX;

  const toArr = byTo.get(c.to) ?? [c];
  const fj = Math.max(0, toArr.indexOf(c));
  const nT = toArr.length;
  const dy1 = nT <= 1 ? 0 : (fj - (nT - 1) / 2) * LOGIC_EDGE_FAN_PX;

  const useFromTrunk = nF > 1;
  const useToTrunk = nT > 1;

  let prefixWaypoints = [];
  let suffixWaypoints = [];

  if (useFromTrunk) {
    const trunkX = a.outX + LOGIC_IF_TRUNK_PX;
    prefixWaypoints = [
      { x: trunkX, y: a.portY },
      { x: trunkX, y: a.portY + dy0 },
    ];
  }
  if (useToTrunk) {
    const approachX = b.inX - LOGIC_IF_TRUNK_PX;
    suffixWaypoints = [
      { x: approachX, y: b.portY + dy1 },
      { x: approachX, y: b.portY },
    ];
  }

  return {
    x0: a.outX,
    y0: useFromTrunk ? a.portY : a.portY + dy0,
    x1: b.inX,
    y1: useToTrunk ? b.portY : b.portY + dy1,
    prefixWaypoints,
    suffixWaypoints,
  };
}
