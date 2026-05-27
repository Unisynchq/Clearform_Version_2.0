import {
  RiArrowRightLine,
  RiGitBranchLine,
  RiSkipForwardLine,
  RiStopCircleLine,
} from 'react-icons/ri';

/** Edge kinds chosen from the connector dot menu */
export const LOGIC_EDGE_KIND = {
  next: 'next',
  if: 'if',
  skip: 'skip',
  end: 'end',
};

/** Replace same from→to if present; `kind: null` = pending until user picks from logic menu */
export const upsertLogicConnection = (prev, from, to, kind) => {
  const tail = prev.filter((c) => !(c.from === from && c.to === to));
  return [...tail, { from, to, kind: kind === undefined ? null : kind }];
};

/** Label + leading icon per edge kind — matches logic connector menu semantics (Figma pill uses same iconography). */
export const logicEdgeKindControlMeta = (kind) => {
  const k = kind ?? LOGIC_EDGE_KIND.next;
  if (k === LOGIC_EDGE_KIND.if) return { label: 'If/Else', Icon: RiGitBranchLine };
  if (k === LOGIC_EDGE_KIND.skip) return { label: 'Skip', Icon: RiSkipForwardLine };
  if (k === LOGIC_EDGE_KIND.end) return { label: 'End', Icon: RiStopCircleLine };
  return { label: 'Next', Icon: RiArrowRightLine };
};

/** SVG marker / edge stroke tokens (shared with logic canvas defs in FormBuilderPage) */
export const LOGIC_EDGE_STROKE = '#b5b3ad';
export const LOGIC_EDGE_STROKE_STRONG = '#8f8d87';
export const LOGIC_EDGE_STROKE_SKIP = '#a8a6a0';
export const LOGIC_EDGE_HOVER_STROKE = '#dc2626';
export const LOGIC_EDGE_KIND_HOVER_STROKE = '#16a34a';

export const getLogicEdgePathProps = (kind) => {
  if (kind == null) {
    return {
      fill: 'none',
      stroke: LOGIC_EDGE_STROKE,
      strokeWidth: 1.25,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeDasharray: '5 4',
      markerEnd: 'url(#logicFlowArrowHeadMuted)',
    };
  }
  const k = kind;
  const base = {
    fill: 'none',
    stroke: LOGIC_EDGE_STROKE_STRONG,
    strokeWidth: 1.25,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    markerEnd: 'url(#logicFlowArrowHead)',
  };
  if (k === LOGIC_EDGE_KIND.if) return { ...base, strokeDasharray: '6 5' };
  if (k === LOGIC_EDGE_KIND.skip) {
    return { ...base, stroke: LOGIC_EDGE_STROKE_SKIP, strokeDasharray: '5 4' };
  }
  if (k === LOGIC_EDGE_KIND.end) return { ...base, strokeWidth: 1.5 };
  return base;
};

/** In-progress wire from output port — always dashed with CSS motion until drop commits */
const LOGIC_CONNECT_DRAG_DASH = '6 5';

export const getLogicConnectDragPathProps = (kind) => {
  const base = getLogicEdgePathProps(kind ?? null);
  return {
    ...base,
    strokeDasharray: LOGIC_CONNECT_DRAG_DASH,
    className: 'logic-connect-drag-path',
  };
};

const getLogicEdgePathPropsHovered = (kind) => {
  const base = getLogicEdgePathProps(kind);
  return {
    ...base,
    stroke: LOGIC_EDGE_HOVER_STROKE,
    markerEnd: 'url(#logicFlowArrowHeadRed)',
  };
};

const getLogicEdgePathPropsKindHovered = (kind) => {
  const base = getLogicEdgePathProps(kind);
  return {
    ...base,
    stroke: LOGIC_EDGE_KIND_HOVER_STROKE,
    markerEnd: 'url(#logicFlowArrowHeadGreen)',
  };
};

export const LOGIC_EDGE_HIT_STROKE_WIDTH = 18;

export const resolveLogicEdgeStrokeProps = (edgeKey, kind, disconnectHoveredKey, kindHoveredKey) => {
  if (disconnectHoveredKey === edgeKey) return getLogicEdgePathPropsHovered(kind);
  if (kindHoveredKey === edgeKey) return getLogicEdgePathPropsKindHovered(kind);
  return getLogicEdgePathProps(kind);
};
