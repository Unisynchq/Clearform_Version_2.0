import {
  RIVER_ALERT_LABEL_COLOR as LABEL,
  getRiverAlertMarkerLayout,
} from './riverAlertMarkerSpec';
import { DROP_CENTER_Y, DROP_TOP_LABEL_OFFSET, DROP_VB_W, DROP_VB_H } from './dropoffRiverConstants';

/**
 * Uniform scale for preserveAspectRatio meet in a W×H box with viewBox DROP_VB_W × DROP_VB_H.
 */
export function riverMeetScale(svgClientWidth, svgClientHeight) {
  return Math.min(svgClientWidth / DROP_VB_W, svgClientHeight / DROP_VB_H);
}

/**
 * Map a Y coordinate in narrow viewBox space into pixels from the top of the SVG box (meet, centered).
 *
 * @param {number} yVb
 * @param {number} scale
 * @param {number} svgClientHeight
 */
export function riverVbYToSvgPx(yVb, scale, svgClientHeight) {
  const frac = (yVb + DROP_TOP_LABEL_OFFSET) / DROP_VB_H;
  const scaledVbH = DROP_VB_H * scale;
  const offsetY = (svgClientHeight - scaledVbH) / 2;
  return offsetY + frac * scaledVbH;
}

/**
 * @param {'critical' | 'attention'} variant
 * @param {number} svgClientWidth
 * @param {number} svgClientHeight
 * @param {{ yTL: number, yTR: number, yBR: number, cornerR: number }} riverMarker
 * @param {number} colHeight — path band height (for vertical centering transform in chart)
 * @param {number} questionCount
 * @returns {{ bandTopPx: number, gapPx: number, hairTopPx: number, hairHeightPx: number, accent: string, hairOpacity: number } | null}
 */
export function computeNarrowSeamOverlay(
  svgClientWidth,
  svgClientHeight,
  riverMarker,
  colHeight,
  questionCount,
  variant = 'critical',
) {
  if (!Number.isFinite(svgClientWidth) || !Number.isFinite(svgClientHeight) || svgClientWidth < 2 || svgClientHeight < 2) {
    return null;
  }

  const scale = riverMeetScale(svgClientWidth, svgClientHeight);
  const L = getRiverAlertMarkerLayout(questionCount);
  const { yTL, yTR, yBR, cornerR } = riverMarker;
  const yPath = DROP_CENTER_Y - colHeight / 2;

  const bandTopVb = yPath + Math.min(yTL, yTR) + L.offsetY;
  const bandTopPx = riverVbYToSvgPx(bandTopVb, scale, svgClientHeight);
  const gapPx = Math.max(3, L.gapPillToRiver * scale);

  const hairTopVb = yPath + yTR + cornerR * 1.05 + L.offsetY;
  const hairBotVb = yPath + yBR - cornerR * 1.05 + L.offsetY;
  const hairTopPx = riverVbYToSvgPx(hairTopVb, scale, svgClientHeight);
  const hairBotPx = riverVbYToSvgPx(hairBotVb, scale, svgClientHeight);
  const hairHeightPx = Math.max(0, hairBotPx - hairTopPx);

  const accent = variant === 'attention' ? LABEL.attention : LABEL.critical;
  return {
    bandTopPx,
    gapPx,
    hairTopPx,
    hairHeightPx,
    accent,
    hairOpacity: L.hairOpacity,
  };
}
