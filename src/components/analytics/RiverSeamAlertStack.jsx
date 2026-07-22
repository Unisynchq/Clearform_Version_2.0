import {
  RIVER_ALERT_LABEL_COLOR as LABEL,
  RIVER_ALERT_PILL_BORDER as PILL_BORDER,
  RIVER_ALERT_PILL_FILL as PILL_FILL,
} from './riverAlertMarkerSpec';

/**
 * HTML pill on the seam between columns (no vertical hairline).
 */
export function RiverSeamAlertStack({ overlay, drop, variant = 'critical' }) {
  const { bandTopPx, gapPx } = overlay;
  const fill = variant === 'attention' ? PILL_FILL.attention : PILL_FILL.critical;
  const border = variant === 'attention' ? PILL_BORDER.attention : PILL_BORDER.critical;
  const textColor = variant === 'attention' ? LABEL.attention : LABEL.critical;

  return (
    <div
      className="pointer-events-none absolute left-1/2 z-[1] inline-flex -translate-x-1/2 items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none tracking-tight tabular-nums shadow-none"
      style={{
        top: bandTopPx,
        transform: `translate(-50%, calc(-100% - ${gapPx}px))`,
        backgroundColor: fill,
        borderColor: border,
        color: textColor,
        fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
        width: 'max-content',
        minWidth: 0,
        maxWidth: 'none',
      }}
    >
      {drop}
    </div>
  );
}

