import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RiSearchLine, RiCheckLine, RiArrowDownSLine } from 'react-icons/ri';

const MENU_W = 210;

/**
 * Figma: Menu item (2608:4942) — searchable field-type dropdown for If/Then conditions.
 */
const LogicFieldPicker = ({
  value,
  onChange,
  options,
  placeholder = 'Select field…',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  const selected = options.find((o) => o.id === value) ?? options[0] ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.min(r.left, window.innerWidth - MENU_W - 8);
    const top = r.bottom + 4;
    setMenuPos({ top: Math.max(8, top), left: Math.max(8, left) });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e) => {
      const t = e.target;
      if (rootRef.current?.contains(t)) return;
      if (t.closest?.('[data-logic-field-picker-menu]')) return;
      setOpen(false);
      setQuery('');
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = (id) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  const menu =
    open &&
    createPortal(
      <div
        data-logic-field-picker-menu
        role="listbox"
        className="fixed z-[200] bg-white border border-[rgba(81,76,84,0.15)] rounded-[12px] shadow-[0_0_0_3px_rgba(84,80,88,0.09)] overflow-hidden"
        style={{
          top: menuPos.top,
          left: menuPos.left,
          width: MENU_W,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div className="bg-[#fafafa] border-b border-[rgba(87,84,91,0.06)] flex items-center gap-2 px-3 py-[11px] min-h-[44px]">
          <RiSearchLine size={16} className="shrink-0 text-[#a1a1aa]" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-[12px] text-[#18181b] outline-none"
            autoFocus
            aria-label="Search fields"
          />
        </div>

        <div className="p-2 max-h-[min(320px,calc(100vh-120px))] overflow-y-auto">
          <div className="flex flex-col gap-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-[12px] text-[#a1a1aa] text-center">No fields found</p>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.id === value;
                const Icon = opt.Icon;
                if (!Icon) return null;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full flex items-center justify-between gap-2 min-h-[32px] pl-2 pr-3 py-1.5 rounded-[8px] text-left cursor-pointer transition-colors ${
                      isSelected ? 'bg-[rgba(89,86,93,0.04)]' : 'hover:bg-[rgba(89,86,93,0.04)]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-[6px] text-[#4c414e]"
                        style={{ backgroundColor: opt.badgeBg ?? '#f4f4f5' }}
                      >
                        <Icon size={16} aria-hidden />
                      </span>
                      <span
                        className={`text-[14px] leading-5 truncate ${
                          isSelected ? 'text-[#4c414e]' : 'text-[#655d67]'
                        }`}
                      >
                        {opt.label}
                      </span>
                    </span>
                    {isSelected ? (
                      <RiCheckLine size={16} className="shrink-0 text-[#4c414e]" aria-hidden />
                    ) : (
                      <span className="size-4 shrink-0" aria-hidden />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>,
      document.body
    );

  const SelectedIcon = selected?.Icon;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen((v) => {
            if (!v) updateMenuPosition();
            return !v;
          });
        }}
        className="w-full flex items-center gap-1.5 bg-white border border-[#e4e4e7] rounded-[5px] px-[7px] py-[5px] text-left cursor-pointer hover:border-[#d4d4d8] transition-colors min-w-0 min-h-[30px]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            {SelectedIcon ? (
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-[6px] text-[#4c414e]"
                style={{ backgroundColor: selected.badgeBg ?? '#f4f4f5' }}
              >
                <SelectedIcon size={14} aria-hidden />
              </span>
            ) : null}
            <span className="flex-1 min-w-0 text-[12px] text-[#18181b] truncate leading-4">
              {selected.label}
            </span>
          </>
        ) : (
          <span className="flex-1 text-[12px] text-[#a1a1aa] truncate">{placeholder}</span>
        )}
        <RiArrowDownSLine
          size={14}
          className={`shrink-0 text-[#a1a1aa] transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {menu}
    </div>
  );
};

export default LogicFieldPicker;
