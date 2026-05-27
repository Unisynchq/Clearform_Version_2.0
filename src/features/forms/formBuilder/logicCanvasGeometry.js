import {
  LOGIC_CONNECTOR_MENU_BOX_H,
  LOGIC_CONNECTOR_MENU_BOX_W,
} from '@/features/forms/formBuilder/builderLayoutConstants';

const LOGIC_ROUTE_PAD = 20;
const LOGIC_ROUTE_EXIT = 40;
const LOGIC_ROUTE_CORNER_R = 16;

export const clampLogicMenuViewportPos = (vx, vy, vr) => {
  const maxX = Math.max(8, vr.width - LOGIC_CONNECTOR_MENU_BOX_W - 8);
  const maxY = Math.max(8, vr.height - LOGIC_CONNECTOR_MENU_BOX_H - 8);
  return {
    vx: Math.min(Math.max(8, vx), maxX),
    vy: Math.min(Math.max(8, vy), maxY),
  };
};

export const logicBezierConnectionPath = (x0, y0, x1, y1) => {
  const span = Math.abs(x1 - x0);
  const dx = Math.max(56, span * 0.5);
  return `M ${x0} ${y0} C ${x0 + dx} ${y0}, ${x1 - dx} ${y1}, ${x1} ${y1}`;
};

/** Point at parameter t along the same cubic used by `logicBezierConnectionPath`, in board space */
export const logicBezierPointAt = (x0, y0, x1, y1, t) => {
  const dx = Math.max(48, Math.abs(x1 - x0) * 0.45);
  const p0 = { x: x0, y: y0 };
  const p1 = { x: x0 + dx, y: y0 };
  const p2 = { x: x1 - dx, y: y1 };
  const p3 = { x: x1, y: y1 };
  const s = 1 - t;
  return {
    x: s ** 3 * p0.x + 3 * s ** 2 * t * p1.x + 3 * s * t ** 2 * p2.x + t ** 3 * p3.x,
    y: s ** 3 * p0.y + 3 * s ** 2 * t * p1.y + 3 * s * t ** 2 * p2.y + t ** 3 * p3.y,
  };
};

export const logicBezierMidpoint = (x0, y0, x1, y1) => logicBezierPointAt(x0, y0, x1, y1, 0.5);

export const logicObstacleFromPort = (id, pos) => ({
  id,
  left: pos.left - LOGIC_ROUTE_PAD,
  top: pos.top - LOGIC_ROUTE_PAD,
  right: pos.left + pos.width + LOGIC_ROUTE_PAD,
  bottom: pos.top + pos.height + LOGIC_ROUTE_PAD,
});

const logicPointInObstacle = (x, y, obstacle) =>
  x >= obstacle.left && x <= obstacle.right && y >= obstacle.top && y <= obstacle.bottom;

const logicBezierHitsObstacle = (x0, y0, x1, y1, obstacle) => {
  for (let t = 0; t <= 1; t += 0.04) {
    const p = logicBezierPointAt(x0, y0, x1, y1, t);
    if (logicPointInObstacle(p.x, p.y, obstacle)) return true;
  }
  return false;
};

const logicPolylineHitsObstacle = (points, obstacle) => {
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const steps = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 12));
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      if (logicPointInObstacle(x, y, obstacle)) return true;
    }
  }
  return false;
};

const logicPickRouteY = (x0, y0, x1, y1, blocking) => {
  const aboveY = Math.min(...blocking.map((o) => o.top)) - LOGIC_ROUTE_PAD;
  const belowY = Math.max(...blocking.map((o) => o.bottom)) + LOGIC_ROUTE_PAD;
  const aboveCost = Math.abs(aboveY - y0) + Math.abs(aboveY - y1);
  const belowCost = Math.abs(belowY - y0) + Math.abs(belowY - y1);
  if (y1 >= y0 && belowCost <= aboveCost * 1.15) return belowY;
  if (y1 < y0 && aboveCost <= belowCost * 1.15) return aboveY;
  return belowCost <= aboveCost ? belowY : aboveY;
};

const logicPointsToSegments = (points) => {
  const segments = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segments.push({ x0: a.x, y0: a.y, x1: b.x, y1: b.y, len });
  }
  return segments;
};

/** Rounded-corner polyline — Typeform-style trunk legs (no sharp elbows). */
const logicSmoothPolylinePathD = (points) => {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return logicBezierConnectionPath(points[0].x, points[0].y, points[1].x, points[1].y);
  }
  const r = LOGIC_ROUTE_CORNER_R;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    const inDx = curr.x - prev.x;
    const inDy = curr.y - prev.y;
    const outDx = next.x - curr.x;
    const outDy = next.y - curr.y;
    const inLen = Math.hypot(inDx, inDy) || 1;
    const outLen = Math.hypot(outDx, outDy) || 1;
    const cornerR = Math.min(r, inLen / 2, outLen / 2);
    const bx = curr.x - (inDx / inLen) * cornerR;
    const by = curr.y - (inDy / inLen) * cornerR;
    const ax = curr.x + (outDx / outLen) * cornerR;
    const ay = curr.y + (outDy / outLen) * cornerR;
    d += ` L ${bx} ${by} Q ${curr.x} ${curr.y} ${ax} ${ay}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
};

const logicObstacleBetween = (o, x0, x1, y0, y1) => {
  const minX = Math.min(x0, x1) - LOGIC_ROUTE_PAD;
  const maxX = Math.max(x0, x1) + LOGIC_ROUTE_PAD;
  const minY = Math.min(y0, y1) - 96;
  const maxY = Math.max(y0, y1) + 96;
  return o.right >= minX && o.left <= maxX && o.bottom >= minY && o.top <= maxY;
};

const logicBezierSegmentLen = (x0, y0, x1, y1) => {
  let len = 0;
  let px = x0;
  let py = y0;
  for (let t = 0.08; t <= 1; t += 0.08) {
    const p = logicBezierPointAt(x0, y0, x1, y1, t);
    len += Math.hypot(p.x - px, p.y - py);
    px = p.x;
    py = p.y;
  }
  return len;
};

const logicBuildRoutedPath = (x0, y0, x1, y1, routeY) => {
  const goingRight = x1 >= x0;
  const exitLen = Math.min(LOGIC_ROUTE_EXIT, Math.max(24, Math.abs(x1 - x0) * 0.12));
  const xOut = goingRight ? x0 + exitLen : x0 - exitLen;
  const xIn = goingRight ? x1 - exitLen : x1 + exitLen;
  const points = [
    { x: x0, y: y0 },
    { x: xOut, y: y0 },
    { x: xOut, y: routeY },
    { x: xIn, y: routeY },
    { x: xIn, y: y1 },
    { x: x1, y: y1 },
  ];
  return {
    d: logicSmoothPolylinePathD(points),
    type: 'polyline',
    points,
    segments: logicPointsToSegments(points),
  };
};

const joinLogicPathParts = (parts) => {
  if (parts.length === 1) return parts[0];
  let d = '';
  const points = [];
  const segments = [];
  for (const p of parts) {
    if (!d) {
      d = p.d;
      if (p.points) points.push(...p.points);
      else points.push({ x: p.x0, y: p.y0 }, { x: p.x1, y: p.y1 });
    } else {
      const trimmed = p.d.replace(/^M\s*[-\d.]+\s+[-\d.]+\s*/i, '');
      d += ` ${trimmed}`;
      if (p.points) points.push(...p.points.slice(1));
      else points.push({ x: p.x1, y: p.y1 });
    }
    if (p.segments) segments.push(...p.segments);
    else if (p.type === 'bezier') {
      segments.push({
        kind: 'bezier',
        x0: p.x0,
        y0: p.y0,
        x1: p.x1,
        y1: p.y1,
        len: logicBezierSegmentLen(p.x0, p.y0, p.x1, p.y1),
      });
    }
  }
  return { type: 'compound', d, points, segments };
};

/** Single segment between two ports — smooth bezier or routed corridor around blocking cards. */
export const buildLogicConnectionSegment = (x0, y0, x1, y1, obstacles = []) => {
  const relevant = obstacles.filter((o) => logicObstacleBetween(o, x0, x1, y0, y1));
  const blocking = relevant.filter((o) => logicBezierHitsObstacle(x0, y0, x1, y1, o));
  if (blocking.length === 0) {
    return {
      d: logicBezierConnectionPath(x0, y0, x1, y1),
      type: 'bezier',
      x0,
      y0,
      x1,
      y1,
      segments: [
        {
          kind: 'bezier',
          x0,
          y0,
          x1,
          y1,
          len: logicBezierSegmentLen(x0, y0, x1, y1),
        },
      ],
    };
  }

  const routeAboveY = Math.min(...blocking.map((o) => o.top)) - LOGIC_ROUTE_PAD;
  const routeBelowY = Math.max(...blocking.map((o) => o.bottom)) + LOGIC_ROUTE_PAD;
  const candidates = [logicPickRouteY(x0, y0, x1, y1, blocking), routeAboveY, routeBelowY];

  for (const routeY of candidates) {
    const routed = logicBuildRoutedPath(x0, y0, x1, y1, routeY);
    const hits = relevant.some((o) => logicPolylineHitsObstacle(routed.points, o));
    if (!hits) return routed;
  }

  return logicBuildRoutedPath(x0, y0, x1, y1, candidates[0]);
};

/**
 * Full connection path with optional shared trunks (branch out / merge in like Typeform).
 * @param {{ prefixWaypoints?: {x:number,y:number}[], suffixWaypoints?: {x:number,y:number}[] }} trunk
 */
export const buildLogicConnectionPath = (x0, y0, x1, y1, obstacles = [], trunk = {}) => {
  const prefix = trunk.prefixWaypoints ?? [];
  const suffix = trunk.suffixWaypoints ?? [];

  if (prefix.length === 0 && suffix.length === 0) {
    return buildLogicConnectionSegment(x0, y0, x1, y1, obstacles);
  }

  const parts = [];

  if (prefix.length > 0) {
    const pts = [{ x: x0, y: y0 }, ...prefix];
    parts.push({
      d: logicSmoothPolylinePathD(pts),
      type: 'polyline',
      points: pts,
      segments: logicPointsToSegments(pts),
    });
  }

  const mainStart = prefix.length > 0 ? prefix[prefix.length - 1] : { x: x0, y: y0 };
  const mainEnd = suffix.length > 0 ? suffix[0] : { x: x1, y: y1 };
  parts.push(
    buildLogicConnectionSegment(mainStart.x, mainStart.y, mainEnd.x, mainEnd.y, obstacles),
  );

  if (suffix.length > 0) {
    const pts = [...suffix, { x: x1, y: y1 }];
    parts.push({
      d: logicSmoothPolylinePathD(pts),
      type: 'polyline',
      points: pts,
      segments: logicPointsToSegments(pts),
    });
  }

  return joinLogicPathParts(parts);
};

export const logicConnectionPathPointAt = (meta, t) => {
  if (meta.type === 'bezier') {
    return logicBezierPointAt(meta.x0, meta.y0, meta.x1, meta.y1, t);
  }
  const total = meta.segments.reduce((sum, seg) => sum + seg.len, 0);
  if (total === 0) return meta.points[0] ?? { x: 0, y: 0 };
  let dist = total * t;
  for (const seg of meta.segments) {
    if (dist <= seg.len || seg === meta.segments[meta.segments.length - 1]) {
      const r = seg.len === 0 ? 0 : dist / seg.len;
      if (seg.kind === 'bezier') {
        return logicBezierPointAt(seg.x0, seg.y0, seg.x1, seg.y1, r);
      }
      return {
        x: seg.x0 + (seg.x1 - seg.x0) * r,
        y: seg.y0 + (seg.y1 - seg.y0) * r,
      };
    }
    dist -= seg.len;
  }
  const last = meta.points[meta.points.length - 1];
  return last ?? { x: 0, y: 0 };
};

export const logicConnectionPathMidpoint = (meta) => logicConnectionPathPointAt(meta, 0.5);
