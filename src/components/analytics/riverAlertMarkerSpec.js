/**
 * Drop-off river column alert — layout tokens (pill + seam hairline).
 * Sits on the trailing viewBox edge (between Qn and Qn+1).
 */
export const RIVER_COLUMN_VB_W = 60;

export const RIVER_ALERT_LABEL_COLOR = {
  critical: '#D94535',
  attention: '#E09B2D',
};

/** Light tint — “minimal glass” behind label text. */
export const RIVER_ALERT_PILL_FILL = {
  critical: 'rgba(217, 69, 53, 0.08)',
  attention: 'rgba(224, 155, 45, 0.09)',
};

/** Hairline border aligned to label hue (~20% opacity). */
export const RIVER_ALERT_PILL_BORDER = {
  critical: 'rgba(217, 69, 53, 0.2)',
  attention: 'rgba(224, 155, 45, 0.2)',
};

export const RIVER_BADGE_FONT_FAMILY = "'DM Sans', ui-sans-serif, system-ui, sans-serif";

const SPEC = {
  nMin: 5,
  nMax: 22,
  seamInsetX: 0.28,
  gapPillToRiver: 5,
  hairStroke: 1.1,
  hairOpacity: 0.34,
};

/**
 * Intrinsic label box in viewBox units (width / height of the text ink).
 * Canvas sizing matches the SVG <text> font so pill padding hugs the glyphs.
 *
 * @param {string} text
 * @param {number} fontSizePx — viewBox-relative px passed to canvas (same as SVG font-size)
 * @param {number} [fontWeight=600]
 */
export function measureRiverBadgeLabel(text, fontSizePx, fontWeight = 600) {
  const wFallback = text.length * fontSizePx * 0.52;
  const hFallback = fontSizePx * 1.18;
  if (typeof document === 'undefined') {
    return { width: wFallback, height: hFallback };
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return { width: wFallback, height: hFallback };
  /** Canvas stacks only the primary face; matches typical SVG fallback for sizing. */
  ctx.font = `${fontWeight} ${fontSizePx}px DM Sans, sans-serif`;
  const m = ctx.measureText(text);
  const ascent = m.actualBoundingBoxAscent ?? fontSizePx * 0.72;
  const descent = m.actualBoundingBoxDescent ?? fontSizePx * 0.22;
  const width = m.width > 0 ? m.width : wFallback;
  return { width, height: ascent + descent };
}

/**
 * @param {number} n — number of river columns
 */
export function getRiverAlertMarkerLayout(n) {
  const { nMin, nMax, seamInsetX, gapPillToRiver, hairStroke, hairOpacity } = SPEC;
  const safe = Number.isFinite(n) && n > 0 ? Math.max(nMin, Math.min(nMax, n)) : nMax;
  const t = nMax > nMin ? (safe - nMin) / (nMax - nMin) : 0;

  /** ~10–10.75 vb units → reads ~11px when column scales. */
  const fontSize = 9.85 + 0.45 * t;
  const fontWeight = 600;
  /** Balanced padding (viewBox units ≈ proportional to column width). */
  const padX = 6.75 + 0.35 * t;
  const padY = 2.85 + 0.15 * t;
  /** Nudge entire marker (pill + line) vertically vs river band. */
  const offsetY = -0.85 - 0.25 * t;

  return {
    fontSize,
    fontWeight,
    padX,
    padY,
    seamInsetX,
    gapPillToRiver,
    hairStroke,
    hairOpacity,
    offsetY,
  };
}
