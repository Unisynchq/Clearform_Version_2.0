import {
  RIVER_ALERT_LABEL_COLOR as LABEL,
  RIVER_ALERT_PILL_FILL as PILL_FILL,
  RIVER_ALERT_PILL_BORDER as PILL_BORDER,
  RIVER_BADGE_FONT_FAMILY,
  RIVER_COLUMN_VB_W,
  getRiverAlertMarkerLayout,
  measureRiverBadgeLabel,
} from './riverAlertMarkerSpec';

/**
 * Drop-off alert: compact **pill** (−NN%) above the band + soft seam hairline.
 * Pill width is intrinsic (text + padding); radius is a full capsule when tall enough.
 *
 * @param {'critical' | 'attention'} variant
 * @param {string | null} [drop]
 * @param {{ yTL: number, yTR: number, yBR: number, cornerR: number }} riverMarker
 * @param {number} [questionCount]
 */
export function RiverColumnAlertMarker({ variant = 'critical', drop = null, riverMarker, questionCount }) {
  const accent = variant === 'attention' ? LABEL.attention : LABEL.critical;
  const fill = variant === 'attention' ? PILL_FILL.attention : PILL_FILL.critical;
  const border = variant === 'attention' ? PILL_BORDER.attention : PILL_BORDER.critical;

  const { yTL, yTR, yBR, cornerR } = riverMarker;
  const L = getRiverAlertMarkerLayout(questionCount ?? 22);

  const xSeam = RIVER_COLUMN_VB_W - L.seamInsetX;
  const bandTop = Math.min(yTL, yTR) + L.offsetY;
  const yHairTop = yTR + cornerR * 1.05 + L.offsetY;
  const yHairBot = yBR - cornerR * 1.05 + L.offsetY;

  const text = drop ?? '';
  const ink = text ? measureRiverBadgeLabel(text, L.fontSize, L.fontWeight) : { width: 0, height: 0 };
  const pillW = ink.width + L.padX * 2;
  const pillH = ink.height + L.padY * 2;
  const pillRx = Math.min(pillW, pillH) / 2;
  const pillX = xSeam - pillW / 2;
  const pillY = bandTop - L.gapPillToRiver - pillH;
  const textY = pillY + pillH / 2;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {yHairBot > yHairTop ? (
        <line
          x1={xSeam}
          x2={xSeam}
          y1={yHairTop}
          y2={yHairBot}
          stroke={accent}
          strokeOpacity={L.hairOpacity}
          strokeWidth={L.hairStroke}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {drop ? (
        <>
          <rect
            x={pillX}
            y={pillY}
            width={pillW}
            height={pillH}
            rx={pillRx}
            ry={pillRx}
            fill={fill}
            stroke={border}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={xSeam}
            y={textY}
            textAnchor="middle"
            dominantBaseline="central"
            fill={accent}
            style={{
              fontSize: L.fontSize,
              fontWeight: L.fontWeight,
              fontFamily: RIVER_BADGE_FONT_FAMILY,
              letterSpacing: '-0.02em',
            }}
          >
            {drop}
          </text>
        </>
      ) : null}
    </g>
  );
}
