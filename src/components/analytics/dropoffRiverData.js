import { readBuilderDraft } from '@/features/forms/utils/builderDraftStorage';

/**
 * Drop-off river data. Matches Figma `riverContent` (1992:47643).
 * Each step is paired with the geometry of its exported vector (Vector*.svg)
 * so the chart can render the same shape inline as <path>.
 */

const STD_GEOM = {
  xL: 0.408,
  xR: 58.896,
  c1x: 26.728,
  c2x: 32.577,
  c3x: 32.577,
  c4x: 26.728,
};

const HL_GEOM = {
  xL: 0.818,
  xR: 59.307,
  c1x: 27.138,
  c2x: 32.987,
  c3x: 32.987,
  c4x: 27.138,
};

const STYLE = {
  healthy: { color: '#15803D', fill: 0.14, stroke: 0.58, sw: 0.95, badge: 'Healthy' },
  attention: { color: '#B45309', fill: 0.15, stroke: 0.65, sw: 0.95, badge: 'Watch' },
  critical: { color: '#DC2626', fill: 0.17, stroke: 0.72, sw: 0.95, badge: 'Critical' },
};

const HL_STYLE = { color: '#15803D', fill: 0.28, stroke: 0.55, sw: 1.75, badge: 'Healthy' };

/** Per-Q vector geometry. `kind` matches `STYLE`. `h` is the SVG box height in px. */
const STEPS = [
  { q: 'Q1', kind: 'healthy', yTL: 0.41, yTR: 0.41, yBR: 155.89, yBL: 155.89, h: 156 },
  { q: 'Q2', kind: 'critical', yTL: 18.27, yTR: 0.41, yBR: 157.99, yBL: 140.13, h: 158, alert: true, drop: '−22%' },
  { q: 'Q3', kind: 'critical', yTL: 29.82, yTR: 0.41, yBR: 166.40, yBL: 136.98, h: 167, alert: true, drop: '−34%' },
  { q: 'Q4', kind: 'attention', yTL: 3.56, yTR: 0.41, yBR: 143.28, yBL: 140.13, h: 144 },
  { q: 'Q5', kind: 'healthy', yTL: 2.51, yTR: 0.41, yBR: 155.89, yBL: 153.79, h: 156 },
  { q: 'Q6', kind: 'healthy', yTL: 0.41, yTR: 0.41, yBR: 151.69, yBL: 151.69, h: 152 },
  { q: 'Q7', kind: 'critical', yTL: 26.67, yTR: 0.41, yBR: 168.50, yBL: 142.23, h: 169, alert: true, drop: '−27%' },
  { q: 'Q8', kind: 'healthy', yTL: 0.41, yTR: 1.46, yBR: 152.74, yBL: 153.79, h: 154 },
  { q: 'Q9', kind: 'attention', yTL: 0.41, yTR: 3.56, yBR: 77.10, yBL: 80.25, h: 81, drop: '−15%' },
  { q: 'Q10', kind: 'healthy', yTL: 0.82, yTR: 18.68, yBR: 125.83, yBL: 143.69, h: 144, highlight: true },
  { q: 'Q11', kind: 'critical', yTL: 0.41, yTR: 6.71, yBR: 86.55, yBL: 92.86, h: 93, alert: true, drop: '−17%' },
  { q: 'Q12', kind: 'healthy', yTL: 3.56, yTR: 0.41, yBR: 153.79, yBL: 150.64, h: 154 },
  { q: 'Q13', kind: 'healthy', yTL: 0.41, yTR: 4.61, yBR: 151.69, yBL: 155.89, h: 156 },
  { q: 'Q14', kind: 'healthy', yTL: 0.41, yTR: 1.46, yBR: 156.94, yBL: 157.99, h: 158 },
  { q: 'Q15', kind: 'critical', yTL: 0.41, yTR: 36.13, yBR: 128.58, yBL: 164.30, h: 164, alert: true, drop: '−18%' },
  { q: 'Q16', kind: 'healthy', yTL: 0.41, yTR: 19.32, yBR: 141.18, yBL: 160.09, h: 160 },
  { q: 'Q17', kind: 'healthy', yTL: 0.41, yTR: 1.46, yBR: 161.14, yBL: 162.19, h: 162 },
  { q: 'Q18', kind: 'healthy', yTL: 0.41, yTR: 2.51, yBR: 164.30, yBL: 166.40, h: 166 },
  { q: 'Q19', kind: 'healthy', yTL: 0.41, yTR: 16.17, yBR: 152.74, yBL: 168.50, h: 168 },
  { q: 'Q20', kind: 'healthy', yTL: 0.41, yTR: 28.77, yBR: 144.33, yBL: 172.70, h: 173 },
  { q: 'Q21', kind: 'healthy', yTL: 49.78, yTR: 0.41, yBR: 172.70, yBL: 123.32, h: 173 },
  { q: 'Q22', kind: 'healthy', yTL: 0.41, yTR: 23.52, yBR: 187.41, yBL: 210.52, h: 210 },
];

/**
 * Build a path that matches the original Figma quad-with-curved-edges but with
 * a small arc at every corner so the join is no longer sharp.
 */
function roundedQuadPath(g, r = 5) {
  const { xL, xR, c1x, c2x, c3x, c4x, yTL, yTR, yBR, yBL } = g;
  const R = Math.min(r, (xR - xL) / 4);
  return [
    `M ${(xL + R).toFixed(2)} ${yTL.toFixed(2)}`,
    `C ${c1x} ${yTL} ${c2x} ${yTR} ${(xR - R).toFixed(2)} ${yTR.toFixed(2)}`,
    `A ${R} ${R} 0 0 1 ${xR.toFixed(2)} ${(yTR + R).toFixed(2)}`,
    `L ${xR.toFixed(2)} ${(yBR - R).toFixed(2)}`,
    `A ${R} ${R} 0 0 1 ${(xR - R).toFixed(2)} ${yBR.toFixed(2)}`,
    `C ${c3x} ${yBR} ${c4x} ${yBL} ${(xL + R).toFixed(2)} ${yBL.toFixed(2)}`,
    `A ${R} ${R} 0 0 1 ${xL.toFixed(2)} ${(yBL - R).toFixed(2)}`,
    `L ${xL.toFixed(2)} ${(yTL + R).toFixed(2)}`,
    `A ${R} ${R} 0 0 1 ${(xL + R).toFixed(2)} ${yTL.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function buildColumn(step, q) {
  const baseGeom = step.highlight ? HL_GEOM : STD_GEOM;
  const geom = { ...baseGeom, yTL: step.yTL, yTR: step.yTR, yBR: step.yBR, yBL: step.yBL };
  const style = step.highlight ? HL_STYLE : STYLE[step.kind];
  const cornerR = step.highlight ? 6 : 5;
  return {
    q,
    kind: step.kind,
    drop: step.drop ?? null,
    alert: !!step.alert,
    highlight: !!step.highlight,
    height: step.h,
    width: 60,
    style,
    d: roundedQuadPath(geom, cornerR),
    /** Trailing seam (viewBox x ≈ 60) + band corners for pill / hairline placement. */
    riverMarker: {
      yTL: step.yTL,
      yTR: step.yTR,
      yBR: step.yBR,
      yBL: step.yBL,
      xL: geom.xL,
      cornerR,
    },
  };
}

const RIVER_Q_MIN = 1;
const RIVER_Q_MAX = STEPS.length;

/** Minimum questions required to show the drop-off river (product rule). */
export const RIVER_MIN_QUESTIONS = 5;

/**
 * Explicit question count from the form, if any (`questionCount` or `questions.length`).
 * Returns `null` when the app should use the default full 22-step demo layout.
 */
export function getRiverQuestionCountRaw(form) {
  if (typeof form?.questionCount === 'number' && Number.isFinite(form.questionCount)) {
    return Math.round(form.questionCount);
  }
  if (Array.isArray(form?.questions)) {
    return form.questions.length;
  }
  return null;
}

/** True when the form has no explicit count (default river) or count >= RIVER_MIN_QUESTIONS. */
export function hasRiverEnoughData(form) {
  const raw = getRiverQuestionCountRaw(form);
  if (raw == null) return true;
  return raw >= RIVER_MIN_QUESTIONS;
}

/**
 * Question count from builder draft when available; otherwise form metadata or default.
 */
export function deriveQuestionCount(form) {
  if (form?.id != null) {
    const draft = readBuilderDraft(form.id);
    const content = draft?.screens?.filter((s) => s.type === 'content') ?? [];
    if (content.length > 0) return content.length;
  }
  const raw = getRiverQuestionCountRaw(form);
  if (raw != null) return Math.max(RIVER_Q_MIN, Math.min(RIVER_Q_MAX, raw));
  const seed = ((form?.id ?? 1) * 2654435761) >>> 0;
  const MIN = 6;
  const MAX = 22;
  return MIN + (seed % (MAX - MIN + 1));
}

/**
 * How many river columns to render when the river is shown. Prefer real form
 * metadata when present; otherwise default to the full 22-step layout.
 * Supported range when explicit: **5 ≤ N ≤ 22** (see `hasRiverEnoughData`).
 */
export function getRiverQuestionCount(form) {
  if (Array.isArray(form?.screenDropoff) && form.screenDropoff.length > 0) {
    return Math.max(RIVER_Q_MIN, Math.min(RIVER_Q_MAX, form.screenDropoff.length));
  }
  const raw = getRiverQuestionCountRaw(form);
  if (raw != null) {
    return Math.max(RIVER_Q_MIN, Math.min(RIVER_Q_MAX, raw));
  }
  return RIVER_Q_MAX;
}

function riverTierForIndex(form, i) {
  const seed = ((form?.id ?? 1) * 2654435761) >>> 0;
  const r1 = (seed >>> (i % 24)) & 0xff;
  const r2 = (seed >>> ((i * 5) % 24)) & 0xff;
  const tier = (r1 + i * 17) % 100;

  let kind;
  let alert = false;
  let drop = null;
  if (tier < 18) {
    kind = 'critical';
    alert = true;
    drop = `−${20 + (r2 % 20)}%`;
  } else if (tier < 38) {
    kind = 'attention';
    drop = r2 % 3 === 0 ? `−${12 + (r2 % 10)}%` : null;
  } else {
    kind = 'healthy';
  }
  return { kind, alert, drop };
}

/**
 * Five-question “wide river” (src/assets/New folder (2) — Vector*.svg).
 * Tiles edge-to-edge; Q2 attention with −18% (orange stroke in source).
 */
const WIDE_SCENARIO_5_SEGMENTS = [
  {
    vbW: 251,
    vbH: 110,
    d: 'M0.841797 0.841797C125.542 0.841797 125.542 2.45345 250.242 2.45345V106.674C125.542 106.674 125.542 108.285 0.841797 108.285V0.841797Z',
  },
  {
    vbW: 252,
    vbH: 168,
    d: 'M0.841797 0.841797C125.542 0.841797 125.542 15.7314 250.242 15.7314V151.392C125.542 151.392 125.542 166.282 0.841797 166.282V0.841797Z',
  },
  {
    vbW: 252,
    vbH: 138,
    d: 'M0.841797 0.841797C125.542 0.841797 125.542 7.62484 250.242 7.62484V129.72C125.542 129.72 125.542 136.503 0.841797 136.503V0.841797Z',
  },
  {
    vbW: 252,
    vbH: 124,
    d: 'M0.841797 0.841797C125.542 0.841797 125.542 8.16748 250.242 8.16748V115.611C125.542 115.611 125.542 122.937 0.841797 122.937V0.841797Z',
  },
  {
    vbW: 251,
    vbH: 178,
    d: 'M0 0.841797C124.7 0.841797 124.7 6.1218 249.4 6.1218V171.562C124.7 171.562 124.7 176.842 0 176.842V0.841797Z',
  },
];

const SCENARIO_FIVE_META = [
  { kind: 'healthy', alert: false, drop: null },
  { kind: 'attention', alert: false, drop: '−18%' },
  { kind: 'healthy', alert: false, drop: null },
  { kind: 'healthy', alert: false, drop: null },
  { kind: 'healthy', alert: false, drop: null },
];

function buildWideRiverColumn(segment, meta, qLabel) {
  const style = STYLE[meta.kind];
  return {
    riverMode: 'wide',
    q: qLabel,
    kind: meta.kind,
    drop: meta.drop ?? null,
    alert: !!meta.alert,
    highlight: false,
    height: segment.vbH,
    width: segment.vbW,
    style,
    wide: { vbW: segment.vbW, vbH: segment.vbH, d: segment.d },
    d: segment.d,
  };
}

function buildRiverScenarioFiveWideColumns() {
  return WIDE_SCENARIO_5_SEGMENTS.map((seg, i) =>
    buildWideRiverColumn(seg, SCENARIO_FIVE_META[i], `Q${i + 1}`),
  );
}

/**
 * Figma scenario 1 (2273:4231) — fixed tier/drops for exactly 10 questions.
 */
const SCENARIO_ONE_OVERRIDES = [
  { kind: 'healthy', alert: false, drop: null },
  { kind: 'critical', alert: true, drop: '−22%' },
  { kind: 'critical', alert: true, drop: '−30%' },
  { kind: 'healthy', alert: false, drop: null },
  { kind: 'healthy', alert: false, drop: null },
  { kind: 'critical', alert: true, drop: '−25%' },
  { kind: 'healthy', alert: false, drop: null },
  { kind: 'attention', alert: false, drop: '−15%' },
  { kind: 'healthy', alert: false, drop: null },
  { kind: 'healthy', alert: false, drop: null },
];

function buildColumnFromApiStep(step, index) {
  const base = STEPS[index % STEPS.length];
  const kind = step.kind ?? 'healthy';
  return buildColumn(
    {
      ...base,
      kind,
      alert: Boolean(step.alert),
      drop: step.drop ?? null,
      highlight: false,
    },
    step.q ?? `Q${index + 1}`,
  );
}

/**
 * River columns for the active form: length = question count.
 * N === 5: wide connected segments (src/assets/New folder (2)).
 * N === 10: Figma scenario 1 severity story.
 * Else: first N STEPS geometry + seeded tier mix, or API `screenDropoff` when present.
 */
export function buildAdaptiveRiverColumns(form) {
  const apiSteps = form?.screenDropoff;
  if (Array.isArray(apiSteps) && apiSteps.length >= RIVER_MIN_QUESTIONS) {
    return apiSteps.map((step, i) => buildColumnFromApiStep(step, i));
  }

  if (!hasRiverEnoughData(form)) {
    return [];
  }
  const n = getRiverQuestionCount(form);
  if (n === SCENARIO_FIVE_META.length) {
    return buildRiverScenarioFiveWideColumns();
  }
  const useScenarioOne = n === SCENARIO_ONE_OVERRIDES.length;

  return Array.from({ length: n }, (_, i) => {
    const base = STEPS[i % STEPS.length];
    const tier = useScenarioOne ? SCENARIO_ONE_OVERRIDES[i] : riverTierForIndex(form, i);
    return buildColumn(
      {
        ...base,
        ...tier,
        highlight: false,
      },
      `Q${i + 1}`,
    );
  });
}

/**
 * Always 22 columns (ignores `form.questionCount`). Kept for callers that need
 * the full-width demo regardless of form metadata.
 */
export function buildRiverColumns(form) {
  return buildAdaptiveRiverColumns({ ...(form || {}), questionCount: STEPS.length });
}

/** Default (full 22-question) layout, kept for non-form callers. */
export const RIVER_COLUMNS = STEPS.map((step) => buildColumn(step, step.q));

export function matchesFilter(filter, kind) {
  if (filter === 'all') return true;
  if (filter === 'critical') return kind === 'critical';
  if (filter === 'watch') return kind === 'attention';
  if (filter === 'healthy') return kind === 'healthy';
  return true;
}

export const RIVER_FILTER_PILLS = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'watch', label: 'Watch' },
  { id: 'healthy', label: 'Healthy' },
];
