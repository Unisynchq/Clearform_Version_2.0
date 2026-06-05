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

/** Prevent panning workflow nodes behind the fixed actions panel. */
export function clampLogicCanvasPan(pan, zoom, boardWidth, viewportWidth) {
  const usableWidth = Math.max(0, viewportWidth - LOGIC_CANVAS_RIGHT_INSET);
  const scaledW = boardWidth * zoom;
  const maxX = usableWidth - scaledW;
  const minX = 0;
  return {
    x: Math.min(maxX, Math.max(minX, pan.x)),
    y: pan.y,
  };
}
