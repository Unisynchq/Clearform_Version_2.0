import { useId } from 'react';

const ACCENT = {
  critical: '#DC2626',
  attention: '#CA8A04',
};

/**
 * Drop-off river column alert — Figma `2286:3720` (soft ribbon) + `2286:3721` (solid dot).
 * Pure SVG (no `<img>` / remote assets). Renders a `<g>` for use inside the column SVG.
 *
 * @param {'critical' | 'attention'} variant
 * @param {number} [cx=30] — horizontal center in parent viewBox units
 * @param {number} [y=-20.5] — vertical anchor for wave + dot
 */
export function RiverColumnAlertMarker({ variant = 'critical', cx = 30, y = -20.5 }) {
  const accent = variant === 'attention' ? ACCENT.attention : ACCENT.critical;
  const blurId = `river-alert-soft-${useId().replace(/:/g, '')}`;

  return (
    <g style={{ pointerEvents: 'none' }}>
      <defs>
        <filter id={blurId} x="-55%" y="-55%" width="210%" height="210%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.15" />
        </filter>
      </defs>
      {/* 2286:3720 — pale translucent wave / ribbon */}
      <path
        d={`M ${cx - 25.5} ${y + 1.2}
           Q ${cx - 12} ${y - 3.4} ${cx} ${y - 0.4}
           Q ${cx + 12} ${y + 2.6} ${cx + 25.5} ${y - 0.3}
           L ${cx + 23.5} ${y + 2.5}
           Q ${cx + 10.5} ${y + 5} ${cx} ${y + 2.6}
           Q ${cx - 10.5} ${y + 0.2} ${cx - 23.5} ${y + 2.8}
           Z`}
        fill={accent}
        fillOpacity={0.2}
        filter={`url(#${blurId})`}
      />
      {/* Non-blurred stroke so the wave reads on light backgrounds */}
      <path
        d={`M ${cx - 24} ${y + 0.2} Q ${cx - 11} ${y - 2.8} ${cx} ${y - 0.2} Q ${cx + 11} ${y + 2.4} ${cx + 24} ${y}`}
        fill="none"
        stroke={accent}
        strokeOpacity={0.22}
        strokeWidth={1.65}
        strokeLinecap="round"
      />
      {/* 2286:3721 — compact status dot */}
      <circle cx={cx} cy={y - 1.4} r={3.15} fill={accent} />
    </g>
  );
}
