import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RiArrowDownSLine, RiCheckLine } from 'react-icons/ri';

const MENU_MIN_W = 160;

/** Custom operator dropdown — matches LogicFieldPicker trigger styling. */
const LogicOperatorPicker = ({ value, onChange, options = [], className = '' }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  const selected = options.find((o) => o.id === value) ?? options[0] ?? null;

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.min(r.left, window.innerWidth - MENU_MIN_W - 8);
    setMenuPos({ top: r.bottom + 4, left: Math.max(8, left) });
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
      if (t.closest?.('[data-logic-operator-picker-menu]')) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
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
  };

  const menu =
    open &&
    createPortal(
      <div
        data-logic-operator-picker-menu
        className="fixed z-[200] rounded-[8px] border border-[#e4e4e7] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        style={{
          top: menuPos.top,
          left: menuPos.left,
          minWidth: MENU_MIN_W,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {options.map((opt) => {
          const picked = opt.id === selected?.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(opt.id)}
              className={`w-full flex items-center justify-between gap-2 min-h-[32px] pl-2 pr-3 py-1.5 text-left cursor-pointer transition-colors ${
                picked ? 'bg-[#f4f4f5]' : 'hover:bg-[#fafaf9]'
              }`}
            >
              <span className="text-[12px] text-[#18181b] truncate">{opt.label}</span>
              {picked ? <RiCheckLine size={14} className="shrink-0 text-[#18181b]" /> : null}
            </button>
          );
        })}
      </div>,
      document.body,
    );

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1.5 bg-white border border-[#e4e4e7] rounded-[5px] px-[7px] py-[5px] text-left cursor-pointer hover:border-[#d4d4d8] transition-colors min-w-0 min-h-[30px]"
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <span className="flex-1 min-w-0 text-[12px] text-[#18181b] truncate">
          {selected?.label ?? 'Operator…'}
        </span>
        <RiArrowDownSLine
          size={14}
          className={`shrink-0 text-[#a1a1aa] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {menu}
    </div>
  );
};

export default LogicOperatorPicker;
