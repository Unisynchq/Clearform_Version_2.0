/** Resolve question/helper text from builder snapshot screens (shared by API + workers). */

export function resolveQuestionTextFromScreen(
  screen: Record<string, unknown>,
): string {
  const config = (screen.config ?? {}) as Record<string, unknown>;
  const label = String(screen.label ?? '');

  return (
    String(config.singleQuestion ?? '') ||
    String(config.multipleQuestion ?? '') ||
    String(config.shortTextQuestion ?? '') ||
    String(config.longTextQuestion ?? '') ||
    String(config.ratingQuestion ?? '') ||
    String(config.contactQuestion ?? '') ||
    String(config.addressQuestion ?? '') ||
    String(config.workQuestion ?? '') ||
    String(config.mediaQuestion ?? '') ||
    String(config.dateQuestion ?? '') ||
    String(config.timeQuestion ?? '') ||
    String(config.question ?? '') ||
    String(screen.name ?? '') ||
    String(screen.title ?? '') ||
    label
  );
}

export function resolveHelperTextFromScreen(
  screen: Record<string, unknown>,
  fieldId?: string,
): string {
  const config = (screen.config ?? {}) as Record<string, unknown>;
  const fields = Array.isArray(screen.fields)
    ? (screen.fields as Record<string, unknown>[])
    : [];
  const field = fields.find((f) => f.id === fieldId) ?? fields[0];

  return (
    String(config.shortTextHelperText ?? '') ||
    String(config.longTextHelperText ?? '') ||
    String(config.contactHelperText ?? '') ||
    String(config.addressHelperText ?? '') ||
    String(config.workHelperText ?? '') ||
    String(config.mediaHelperText ?? '') ||
    String(field?.helperText ?? '') ||
    String(field?.placeholder ?? '')
  );
}
