import { useEffect, useRef } from 'react';
import {
  LOGIC_EDGE_KIND,
  LOGIC_EDGE_HIT_STROKE_WIDTH,
  resolveLogicEdgeStrokeProps,
} from '@/features/forms/formBuilder/logicEdgeModel';

/** Visible edge + wide transparent hit stroke (hover line → green, click → logic options) */
const LogicEdgePathGroup = ({
  d,
  edgeKey,
  kind,
  connection,
  disconnectHoveredKey,
  kindHoveredKey,
  onKindEnter,
  onKindLeave,
  onEdgeClick,
  hitsOnly = false,
  animateDraw = false,
}) => {
  const pathRef = useRef(null);
  const strokeProps = resolveLogicEdgeStrokeProps(
    edgeKey,
    kind,
    disconnectHoveredKey,
    kindHoveredKey,
  );

  useEffect(() => {
    const el = pathRef.current;
    if (!animateDraw || !el || hitsOnly) return undefined;
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    const raf = requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 300ms ease-out';
      el.style.strokeDashoffset = '0';
    });
    return () => cancelAnimationFrame(raf);
  }, [animateDraw, d, hitsOnly]);

  if (hitsOnly) {
    return (
      <g data-logic-edge={edgeKey}>
        <path
          d={d}
          fill="none"
          stroke="transparent"
          strokeWidth={LOGIC_EDGE_HIT_STROKE_WIDTH}
          pointerEvents="stroke"
          className="cursor-pointer"
          aria-label={
            kind === LOGIC_EDGE_KIND.if
              ? 'Edit if/else logic for this connection'
              : 'Open logic options for this connection'
          }
          onPointerEnter={() => onKindEnter(edgeKey)}
          onPointerLeave={onKindLeave}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onEdgeClick(connection, e.clientX, e.clientY);
          }}
        />
      </g>
    );
  }

  return (
    <g data-logic-edge={edgeKey} pointerEvents="none">
      <path ref={pathRef} d={d} pointerEvents="none" {...strokeProps} />
    </g>
  );
};

export default LogicEdgePathGroup;
