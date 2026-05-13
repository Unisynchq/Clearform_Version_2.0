import { useEffect, useLayoutEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { RiverColumnAlertMarker } from './RiverColumnAlertMarker';
import { RIVER_COLUMNS, matchesFilter } from './dropoffRiverData';

const CHART_H = 260;
const CENTER_Y = CHART_H / 2;
const TOP_LABEL_OFFSET = 28;

const REVEAL_EASE = [0.22, 1, 0.36, 1];

/** Authoring width inside each mini-SVG viewBox. */
const LOGICAL_COL_W = 60;
const VB_H = TOP_LABEL_OFFSET + CHART_H;

function riverGridMinPx(n) {
  if (n <= 5) return 40;
  if (n <= 8) return 36;
  if (n <= 12) return 32;
  return 28;
}

function riverPadBottom(n) {
  if (n <= 8) return 'pb-14';
  if (n <= 12) return 'pb-[3.25rem]';
  return 'pb-12';
}

export default function DropoffRiverChart({
  columns = RIVER_COLUMNS,
  filter = 'all',
  hoverIndex = null,
  onHoverIndex,
  onSelectIndex,
  selectedIndex = null,
  startedLabel = '1,840 started',
  finishedLabel = '248 finished',
  /** Receive column center X coords (relative to anchorRef, or chart root if omitted). */
  onColumnCentersMeasured,
  /** When set, column centers are measured from this element (e.g. tooltip offset parent). */
  anchorRef = null,
}) {
  const chartRootRef = useRef(null);
  const rowElRef = useRef(null);
  const cellRefs = useRef([]);
  const n = columns.length;
  const padBottom = riverPadBottom(n);
  const gridMinPx = riverGridMinPx(n);
  const cellClasses = 'min-w-0';

  /** Measure column centers relative to chart root (for tooltip pinned to wrapper). */
  useLayoutEffect(() => {
    if (!onColumnCentersMeasured) return;
    const root = chartRootRef.current;
    if (!root) return;

    const measure = () => {
      const anchor = anchorRef?.current ?? root;
      const anchorRect = anchor.getBoundingClientRect();
      const centers = columns.map((_, i) => {
        const el = cellRefs.current[i];
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return r.left + r.width / 2 - anchorRect.left;
      });
      const rights = columns.map((_, i) => {
        const el = cellRefs.current[i];
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return r.right - anchorRect.left;
      });
      const totalWidth = anchor.offsetWidth;
      onColumnCentersMeasured({ centers, rights, totalWidth });
    };

    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro) {
      ro.observe(root);
      const ae = anchorRef?.current;
      if (ae && ae !== root) ro.observe(ae);
    }
    window.addEventListener('resize', measure);
    const scrollParent = root.parentElement;
    if (scrollParent) scrollParent.addEventListener('scroll', measure, { passive: true });
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', measure);
      if (scrollParent) scrollParent.removeEventListener('scroll', measure);
    };
  }, [columns, filter, hoverIndex, selectedIndex, n, onColumnCentersMeasured, anchorRef]);

  /** Keep refs array aligned with indices. */
  useEffect(() => {
    cellRefs.current = cellRefs.current.slice(0, n);
  }, [n]);

  return (
    <div ref={chartRootRef} className="mx-auto flex w-full min-w-0 max-w-full flex-col gap-3 bg-transparent">
      <div className="flex items-baseline justify-between gap-6 px-0.5 text-[11px] font-medium tracking-tight text-[rgba(26,26,26,0.38)] tabular-nums">
        <p className="min-w-0 truncate">{startedLabel}</p>
        <p className="min-w-0 shrink-0 truncate text-right">{finishedLabel}</p>
      </div>

      <div
        ref={rowElRef}
        className="relative grid w-full min-w-0 gap-0 overflow-visible"
        style={{ gridTemplateColumns: n > 0 ? `repeat(${n}, minmax(${gridMinPx}px, 1fr))` : undefined }}
        aria-label={`Drop-off across ${n} questions`}
      >
        {columns.map((col, i) => {
          const isMuted = filter !== 'all' && !matchesFilter(filter, col.kind);
          const isWide = col.riverMode === 'wide' && col.wide;
          const y = CENTER_Y - col.height / 2;
          const isHovered = hoverIndex === i;
          const isSelected = selectedIndex === i;
          const colDelay = 0.04 + i * 0.025;
          const wideFillBase = 0.16;
          const wideFill = isHovered || isSelected ? Math.min(wideFillBase + 0.08, 0.28) : wideFillBase;

          return (
            <div
              key={`slot-${col.q}-${i}`}
              role="button"
              ref={(el) => {
                cellRefs.current[i] = el;
              }}
              data-river-index={i}
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`${col.q} ${col.style.badge}${col.drop ? ` ${col.drop}` : ''}`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              onMouseEnter={() => onHoverIndex?.(i)}
              onMouseLeave={() => onHoverIndex?.(null)}
              onFocus={() => onHoverIndex?.(i)}
              onBlur={() => onHoverIndex?.(null)}
              onClick={() => onSelectIndex?.(selectedIndex === i ? null : i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectIndex?.(selectedIndex === i ? null : i);
                }
              }}
              className={`group relative ${cellClasses} cursor-pointer select-none border-0 bg-transparent p-0 text-left font-sans
              outline-none transition-[filter,opacity,box-shadow] duration-300 ease-out
              focus:outline-none focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-[rgba(74,79,237,0.45)] focus-visible:ring-offset-0
              ${isMuted ? 'blur-[6px] opacity-[0.62] saturate-100' : 'opacity-100'}
              ${isSelected ? 'z-[3] rounded-[16px]' : 'z-[1]'}`}
            >
              {isSelected ? (
                <motion.div
                  layoutId="river-sel-band"
                  className="pointer-events-none absolute inset-x-0 top-6 bottom-[3.75rem] z-0 rounded-[16px] bg-[rgba(15,23,42,0.085)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                  aria-hidden
                />
              ) : null}

              <div className={`relative z-[1] w-full overflow-visible pt-7 ${isWide ? 'px-0' : 'px-px'}`}>
                {isWide ? (
                  <svg
                    viewBox={`0 0 ${col.wide.vbW} ${col.wide.vbH}`}
                    width="100%"
                    height={CHART_H}
                    preserveAspectRatio="none"
                    className="mx-auto block w-full max-w-full overflow-visible [&_text]:outline-none"
                  >
                    <motion.path
                      key={`p-wide-${filter}-${col.q}`}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: isHovered || isSelected ? 1 : 0.96,
                      }}
                      transition={{ duration: 0.45, delay: colDelay, ease: REVEAL_EASE }}
                      d={col.wide.d}
                      fill={col.style.color}
                      fillOpacity={wideFill}
                      stroke={col.style.color}
                      strokeOpacity={col.style.stroke}
                      strokeWidth={1.85}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                ) : (
                  <svg
                    viewBox={`0 ${-TOP_LABEL_OFFSET} ${LOGICAL_COL_W} ${VB_H}`}
                    width="100%"
                    height={CHART_H + TOP_LABEL_OFFSET}
                    preserveAspectRatio="none"
                    className="mx-auto block w-full max-h-[260px] max-w-full overflow-visible [&_text]:outline-none"
                  >
                    <g transform={`translate(0, ${y})`} style={{ pointerEvents: 'none' }}>
                      <motion.path
                        key={`p-${filter}-${col.q}`}
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: isHovered || isSelected ? 1 : 0.94,
                        }}
                        transition={{ duration: 0.45, delay: colDelay, ease: REVEAL_EASE }}
                        d={col.d}
                        fill={col.style.color}
                        fillOpacity={
                          isHovered || isSelected
                            ? Math.min(col.style.fill + 0.07, 0.32)
                            : col.style.fill
                        }
                        stroke={col.style.color}
                        strokeOpacity={col.style.stroke}
                        strokeWidth={col.style.sw}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      {col.alert ? (
                        <motion.g
                          initial={{ opacity: 0, scale: 0.94 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.26, delay: colDelay + 0.1, ease: 'easeOut' }}
                        >
                          <RiverColumnAlertMarker
                            variant={col.kind === 'attention' ? 'attention' : 'critical'}
                            cx={LOGICAL_COL_W / 2}
                          />
                        </motion.g>
                      ) : null}
                    </g>
                  </svg>
                )}
              </div>

              <div className={`relative z-[1] ${padBottom} flex shrink-0 flex-col items-center justify-start gap-0.5 px-px`}>
                <span
                  className={`block w-full truncate py-2 text-[10px] font-medium md:text-[11px] ${
                    isSelected ? 'text-[#18181b]' : 'text-[rgba(0,0,0,0.42)] group-hover:text-[#3f3f46]'
                  }`}
                >
                  {col.q}
                </span>
                {col.drop ? (
                  <span
                    className={`block w-full truncate text-[10px] font-normal tabular-nums md:text-[11px] ${
                      col.kind === 'attention'
                        ? 'text-[rgba(202,138,4,0.95)]'
                        : 'text-[rgba(185,28,28,0.9)]'
                    }`}
                  >
                    {col.drop}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
