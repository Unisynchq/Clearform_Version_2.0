/**
 * Single extractor for per-screen response-quality config stored inside the
 * form snapshot JSON. The live controller, the async quality processor, and
 * FormContextService must all read the snapshot the same way — divergent
 * copies previously made post-submit scoring ignore the owner's AI guidance.
 */

const AI_GUIDANCE_MAX_LENGTH = 600;

type SnapshotScreen = { config?: Record<string, unknown> } & Record<
  string,
  unknown
>;

export function qualityOptionsFromScreen(
  screen: SnapshotScreen,
  fieldId?: string,
): Record<string, unknown> | undefined {
  const config = (screen.config ?? {}) as Record<string, unknown>;
  // Frontend persists per-field-kind option objects; prefer the one matching
  // the field being evaluated, then the other kind, then legacy keys.
  const isLongText = String(fieldId ?? '').includes('long');
  const fieldKindOptions = isLongText
    ? (config.longTextResponseQualityOptions ??
      config.shortTextResponseQualityOptions)
    : (config.shortTextResponseQualityOptions ??
      config.longTextResponseQualityOptions);
  const nested =
    fieldKindOptions ??
    config.quality ??
    config.qualityOptions ??
    config.answerQuality;
  if (nested && typeof nested === 'object') {
    return nested as Record<string, unknown>;
  }
  return undefined;
}

/** Owner's free-text AI guidance saved with the screen's quality options. */
export function customInstructionsFromScreen(
  screen: SnapshotScreen,
  fieldId?: string,
): string | undefined {
  const options = qualityOptionsFromScreen(screen, fieldId);
  const raw = options?.customInstructions;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim().slice(0, AI_GUIDANCE_MAX_LENGTH);
  return trimmed || undefined;
}

export function extractQualityContextFromScreen(
  screen: SnapshotScreen,
  fieldId?: string,
): {
  options?: Record<string, unknown>;
  customInstructions?: string;
} {
  return {
    options: qualityOptionsFromScreen(screen, fieldId),
    customInstructions: customInstructionsFromScreen(screen, fieldId),
  };
}
