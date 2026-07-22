/** Placeholder purpose text the builder pre-fills — carries no signal. */
export const PURPOSE_PLACEHOLDERS = new Set([
  'add the purpose of form here',
  'add the purpose of the form here',
]);

function textValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
  }
  return '';
}

/** Form-wide purpose from snapshot intro — used in eval prompts and form context. */
export function resolveFormPurpose(
  snapshot: unknown,
  fallbackTitle = '',
): string {
  if (!snapshot || typeof snapshot !== 'object') {
    return fallbackTitle.trim();
  }
  const s = snapshot as Record<string, unknown>;
  const intro = (s.intro ?? {}) as Record<string, unknown>;
  const raw = textValue(
    intro.description,
    intro.subtitle,
    s.description,
    s.purpose,
  ).trim();
  if (!raw || PURPOSE_PLACEHOLDERS.has(raw.toLowerCase())) {
    return fallbackTitle.trim();
  }
  return raw;
}
