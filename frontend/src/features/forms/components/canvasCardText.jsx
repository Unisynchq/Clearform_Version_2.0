import InlineEditableField from './InlineEditableField';

const alignClass = (align) =>
  align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

const RequiredMark = () => <span className="text-red-600 ml-1">*</span>;

const resolveTextColor = (textColor, fallback) =>
  textColor ?? `var(--card-text-color, ${fallback})`;

const resolveMutedColor = (mutedTextColor, fallback) =>
  mutedTextColor ?? `var(--card-text-muted, ${fallback})`;

/** Primary question line on field cards */
export function CanvasQuestionText({
  value,
  onChange,
  isPreviewMode,
  required = false,
  align = 'left',
  fontSize = '32px',
  fontWeight = '600',
  className = '',
  textColor,
}) {
  const suffix = required ? <RequiredMark /> : null;
  const base = `tracking-[-0.52px] leading-[1.3] flex-1 min-w-0 ${alignClass(align)} ${className}`;

  return (
    <InlineEditableField
      value={value}
      onChange={onChange}
      disabled={isPreviewMode}
      className={base}
      style={{ fontSize, fontWeight, color: resolveTextColor(textColor, '#111') }}
      placeholder="Add question…"
      suffix={suffix}
      aria-label="Question"
    />
  );
}

/** Helper / subcopy under questions */
export function CanvasHelperText({
  value,
  onChange,
  isPreviewMode,
  align = 'left',
  className = '',
  mutedTextColor,
}) {
  if (!value && isPreviewMode) return null;

  return (
    <InlineEditableField
      value={value}
      onChange={onChange}
      disabled={isPreviewMode}
      className={`text-[15px] font-light mt-[1px] ${alignClass(align)} ${className}`}
      style={{ color: resolveMutedColor(mutedTextColor, '#888') }}
      placeholder="Add helper text…"
      aria-label="Helper text"
    />
  );
}

/** Choice option label — inline editable on builder canvas */
export function CanvasOptionLabel({
  value,
  onChange,
  isPreviewMode,
  italic = false,
  className = '',
}) {
  if (italic) {
    return (
      <span className={`text-[#aaa] italic min-w-0 break-words ${className}`}>{value}</span>
    );
  }

  return (
    <InlineEditableField
      value={value}
      onChange={onChange}
      disabled={isPreviewMode || typeof onChange !== 'function'}
      className={`text-[#111] min-w-0 break-words flex-1 ${className}`}
      aria-label="Option label"
    />
  );
}

/** Section badge / uppercase label (heading sub-heading) */
export function CanvasBadgeText({
  value,
  onChange,
  isPreviewMode,
  align = 'left',
  className = '',
  mutedTextColor,
}) {
  return (
    <InlineEditableField
      value={value}
      onChange={onChange}
      disabled={isPreviewMode}
      className={`text-[15px] tracking-[0.42px] uppercase ${alignClass(align)} ${className}`}
      style={{ color: resolveMutedColor(mutedTextColor, '#888') }}
      placeholder="SECTION"
      aria-label="Section label"
    />
  );
}
