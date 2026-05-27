import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  RiArrowUpSLine,
  RiArrowDownSLine,
  RiCloseLine,
} from 'react-icons/ri';

const Q_START = 3;

function answerToChips(text) {
  if (text == null || text === '' || text === '—') return [];
  return String(text)
    .split(/\s*·\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AnalyticsResponseDetailDrawer({
  open,
  onClose,
  row,
  rowIndex,
  totalRows,
  onPrev,
  onNext,
  headers,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!row) return null;

  const canPrev = rowIndex > 0;
  const canNext = rowIndex < totalRows - 1;

  const node = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="response-drawer-backdrop"
            role="presentation"
            aria-hidden
            className="fixed inset-0 z-[100] bg-black/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            key="response-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="response-drawer-title"
            className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-[420px] flex-col border-l border-[rgba(0,0,0,0.08)] bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.08)]"
            initial={{ x: '104%' }}
            animate={{ x: 0 }}
            exit={{ x: '104%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-[44px] shrink-0 items-center gap-2.5 border-b border-[rgba(0,0,0,0.08)] px-4">
              <motion.button
                type="button"
                disabled={!canPrev}
                whileTap={canPrev ? { scale: 0.92 } : {}}
                className="flex size-[26px] shrink-0 items-center justify-center rounded-[5px] border border-[rgba(0,0,0,0.08)] bg-white text-[#5c5c58] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous response"
                onClick={() => canPrev && onPrev?.()}
              >
                <RiArrowUpSLine size={12} />
              </motion.button>
              <motion.button
                type="button"
                disabled={!canNext}
                whileTap={canNext ? { scale: 0.92 } : {}}
                className="flex size-[26px] shrink-0 items-center justify-center rounded-[5px] border border-[rgba(0,0,0,0.08)] bg-white text-[#5c5c58] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next response"
                onClick={() => canNext && onNext?.()}
              >
                <RiArrowDownSLine size={12} />
              </motion.button>
              <p
                id="response-drawer-title"
                className="min-w-0 flex-1 truncate text-left text-[13px] font-normal leading-normal text-[#5c5c58]"
              >
                {row[1]}
              </p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                className="flex size-[26px] shrink-0 items-center justify-center rounded-[5px] border border-[rgba(0,0,0,0.08)] bg-white text-[#5c5c58]"
                aria-label="Close"
                onClick={onClose}
              >
                <RiCloseLine size={12} />
              </motion.button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={rowIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col"
                >
                  {headers.slice(Q_START).map((h, j) => {
                    const i = Q_START + j;
                    const Icon = h.Icon;
                    const chips = answerToChips(row[i]);
                    const raw = row[i];
                    const displayChips =
                      chips.length > 0 ? chips : raw && raw !== '—' ? [raw] : [];

                    return (
                      <div
                        key={h.label}
                        className="border-b border-[rgba(0,0,0,0.08)] px-5 pb-5 pt-[18px]"
                      >
                        <div className="flex gap-2.5">
                          {Icon ? (
                            <span
                              className="mt-px flex size-[26px] shrink-0 items-center justify-center rounded-[6px] text-[#5c5c58]"
                              style={{ backgroundColor: h.iconBg ?? '#fff7ed' }}
                            >
                              <Icon size={14} aria-hidden />
                            </span>
                          ) : null}
                          <p className="min-w-0 flex-1 text-[14px] font-medium leading-[1.35] text-[#181816]">
                            {h.label}
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5 pl-[36px]">
                          {displayChips.length === 0 ? (
                            <span className="text-[13px] text-[#8a8880]">—</span>
                          ) : (
                            displayChips.map((chip, chipIdx) => (
                              <motion.span
                                key={`${chip}-${chipIdx}`}
                                layout
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                  type: 'spring',
                                  stiffness: 500,
                                  damping: 34,
                                }}
                                className="inline-flex items-center rounded-[5px] border border-[rgba(0,0,0,0.13)] bg-white px-[13px] py-[5px] text-[13px] font-normal leading-normal text-[#181816]"
                              >
                                {chip}
                              </motion.span>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(node, document.body);
}
