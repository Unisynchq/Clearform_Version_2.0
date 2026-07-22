import { useCallback, useEffect, useId, useRef, useState } from 'react';

const HOVER_AFFORDANCE =
  'cursor-text rounded-[2px] transition-[background-color,box-shadow] hover:bg-[rgba(0,0,0,0.03)] hover:shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.12)]';

const INPUT_RESET =
  'block w-full min-w-0 bg-transparent border-0 outline-none ring-0 shadow-none p-0 m-0 appearance-none resize-none';

/**
 * Click-to-edit field bound directly to parent state (configure panel uses the same state).
 */
export default function InlineEditableField({
  value = '',
  onChange,
  disabled = false,
  multiline = false,
  as: Tag = 'p',
  className = '',
  style = {},
  placeholder = '',
  maxLength,
  suffix = null,
  rows = 1,
  editWrapperClassName = '',
  'aria-label': ariaLabel,
}) {
  const fieldId = useId();
  const inputRef = useRef(null);
  const rootRef = useRef(null);
  const revertValueRef = useRef(value);
  const [editing, setEditing] = useState(false);

  const canEdit = !disabled && typeof onChange === 'function';

  const startEditing = useCallback(() => {
    if (!canEdit) return;
    revertValueRef.current = value ?? '';
    setEditing(true);
  }, [canEdit, value]);

  const stopEditing = useCallback(() => {
    setEditing(false);
  }, []);

  const revert = useCallback(() => {
    onChange(revertValueRef.current ?? '');
    stopEditing();
  }, [onChange, stopEditing]);

  useEffect(() => {
    if (!editing) return undefined;
    const input = inputRef.current;
    if (!input) return undefined;

    input.focus();
    const len = input.value.length;
    try {
      input.setSelectionRange(len, len);
    } catch {
      /* some input types omit selection */
    }

    const onDocPointerDown = (e) => {
      if (rootRef.current?.contains(e.target)) return;
      if (e.target.closest?.('[data-builder-config-panel]')) return;
      stopEditing();
    };

    document.addEventListener('mousedown', onDocPointerDown);
    return () => document.removeEventListener('mousedown', onDocPointerDown);
  }, [editing, stopEditing]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      revert();
      return;
    }
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
      return;
    }
    if (multiline && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  const sharedClass = `${INPUT_RESET} ${className}`.trim();
  const isEmpty = !value?.length;
  const display = isEmpty ? placeholder || '\u00a0' : value;
  const showPlaceholderTone = isEmpty && !!placeholder;

  if (!canEdit) {
    return (
      <Tag className={className} style={style}>
        {display}
        {suffix}
      </Tag>
    );
  }

  if (editing) {
    const InputTag = multiline ? 'textarea' : 'input';
    return (
      <div ref={rootRef} className={`min-w-0 ${editWrapperClassName || 'w-full'}`}>
        <InputTag
          ref={inputRef}
          id={fieldId}
          value={value ?? ''}
          onChange={(e) => {
            const next = maxLength != null ? e.target.value.slice(0, maxLength) : e.target.value;
            onChange(next);
          }}
          onBlur={stopEditing}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={multiline ? rows : undefined}
          maxLength={maxLength}
          aria-label={ariaLabel}
          className={sharedClass}
          style={style}
        />
        {suffix}
      </div>
    );
  }

  return (
    <Tag
      ref={rootRef}
      role="button"
      tabIndex={0}
      onClick={startEditing}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startEditing();
        }
      }}
      className={`${className} ${HOVER_AFFORDANCE} min-h-[1.3em] ${showPlaceholderTone ? 'text-[#aaa]' : ''}`.trim()}
      style={style}
      aria-label={ariaLabel ? `${ariaLabel}, click to edit` : 'Click to edit'}
    >
      {display}
      {suffix}
    </Tag>
  );
}
