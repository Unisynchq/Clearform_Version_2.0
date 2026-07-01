/** Shared logic canvas viewport surface (manual + AI-driven). */
export const LOGIC_CANVAS_VIEWPORT_CLASS =
  'relative flex-1 min-h-0 overflow-hidden bg-[#e8e8e6] isolate';

export const LOGIC_CANVAS_DOT_GRID_STYLE = {
  backgroundImage:
    'radial-gradient(circle at center, rgba(0,0,0,0.08) 1.25px, transparent 1.25px)',
  backgroundSize: '22px 22px',
};

/** Fixed Integrate + Webhooks stack — keep in sync with LogicCanvasActionsPanel `w-[224px]` + `right-4`. */
export const LOGIC_CANVAS_ACTIONS_PANEL_WIDTH = 224;
export const LOGIC_CANVAS_ACTIONS_PANEL_OFFSET_RIGHT = 16;
export const LOGIC_CANVAS_ACTIONS_PANEL_MARGIN = 20;
export const LOGIC_CANVAS_RIGHT_INSET =
  LOGIC_CANVAS_ACTIONS_PANEL_WIDTH +
  LOGIC_CANVAS_ACTIONS_PANEL_OFFSET_RIGHT +
  LOGIC_CANVAS_ACTIONS_PANEL_MARGIN;

/**
 * Bound panning on both axes so the board can always be dragged fluidly
 * (left/right/up/down/diagonal) while keeping at least a margin of it in view.
 *
 * The previous version only clamped X against a zero minimum, which pinned the
 * translation to a single value whenever the board was wider than the viewport —
 * making horizontal panning feel locked while vertical stayed free.
 */
export function clampLogicCanvasPan(
  pan,
  zoom,
  boardWidth,
  viewportWidth,
  boardHeight = 0,
  viewportHeight = 0,
) {
  // Keep min <= max so we never invert the range and pin the pan to one point.
  const bound = (value, lo, hi) => (hi < lo ? value : Math.min(hi, Math.max(lo, value)));

  const usableWidth = Math.max(0, viewportWidth - LOGIC_CANVAS_RIGHT_INSET);
  const scaledW = boardWidth * zoom;
  // Always leave at least this much of the board reachable on each edge.
  const marginX = Math.min(140, usableWidth * 0.5);
  const x = bound(pan.x, marginX - scaledW, usableWidth - marginX);

  // Y is only clamped when the viewport height is known; otherwise stay free.
  let y = pan.y;
  if (viewportHeight > 0) {
    const scaledH = boardHeight * zoom;
    const marginY = Math.min(140, viewportHeight * 0.5);
    y = bound(pan.y, marginY - scaledH, viewportHeight - marginY);
  }

  return { x, y };
}
