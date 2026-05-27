/** Fractions along the rendered SVG path for edge overlays */
export const LOGIC_PATH_PILL_T = 0.5;
export const LOGIC_PATH_DISCONNECT_T = 0.35;

/**
 * Sample a point on an SVG path `d` by normalized length (0–1).
 * Uses a detached path element so positions match the visible stroke.
 */
/** Fallback when SVGPathElement.getTotalLength is unavailable (e.g. jsdom). */
function sampleSimplePathAt(pathD, t) {
  const nums = pathD.match(/-?\d*\.?\d+/g);
  if (!nums || nums.length < 4) return { x: 0, y: 0 };
  const x0 = Number(nums[0]);
  const y0 = Number(nums[1]);
  const x1 = Number(nums[nums.length - 2]);
  const y1 = Number(nums[nums.length - 1]);
  const clamped = Math.max(0, Math.min(1, t));
  return {
    x: x0 + (x1 - x0) * clamped,
    y: y0 + (y1 - y0) * clamped,
  };
}

export function getLogicPathPointAtLength(pathD, t) {
  if (!pathD) {
    return { x: 0, y: 0 };
  }
  if (typeof document !== 'undefined') {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    if (typeof path.getTotalLength === 'function' && typeof path.getPointAtLength === 'function') {
      const total = path.getTotalLength();
      if (Number.isFinite(total) && total > 0) {
        const clamped = Math.max(0, Math.min(1, t));
        const p = path.getPointAtLength(total * clamped);
        return { x: p.x, y: p.y };
      }
    }
  }
  return sampleSimplePathAt(pathD, t);
}
