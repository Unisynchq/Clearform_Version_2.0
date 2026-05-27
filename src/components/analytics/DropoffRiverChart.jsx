import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  DROP_CENTER_Y,
  DROP_CHART_H,
  DROP_TOP_LABEL_OFFSET,
  DROP_VB_H,
  DROP_VB_W,
} from './dropoffRiverConstants';
import { deriveFormStats } from './analyticsStats';
import { computeNarrowSeamOverlay } from './riverSeamOverlayLayout';
import { RiverSeamAlertStack } from './RiverSeamAlertStack';
import { RIVER_COLUMNS, matchesFilter } from './dropoffRiverData';

const CHART_H = DROP_CHART_H;
const CENTER_Y = DROP_CENTER_Y;
const TOP_LABEL_OFFSET = DROP_TOP_LABEL_OFFSET;
const LOGICAL_COL_W = DROP_VB_W;
const VB_H = DROP_VB_H;

const REVEAL_EASE = [0.22, 1, 0.36, 1];

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
  /** When set, started/finished captions follow this form’s performance stats. */
  form = null,
  onColumnCentersMeasured,
  anchorRef = null,
}) {
  const chartRootRef = useRef(null);
  const rowElRef = useRef(null);
  const cellRefs = useRef([]);
  const n = columns.length;
  const padBottom = riverPadBottom(n);
  const gridMinPx = riverGridMinPx(n);
  const cellClasses = 'min-w-0';
  const [seamOverlays, setSeamOverlays] = useState({});

  const { startedLabel, finishedLabel } = useMemo(() => {
    const stats = deriveFormStats(form);
    return {
      startedLabel: `${stats.started.toLocaleString()} started`,
      finishedLabel: `${stats.submitted.toLocaleString()} finished`,
    };
  }, [form]);

  useLayoutEffect(() => {
    const root = chartRootRef.current;
    if (!root) return;

    const measure = () => {
      const nextOverlays = {};
      columns.forEach((col, i) => {
        const isWide = col.riverMode === 'wide' && col.wide;
        if (!col.alert || !col.drop || isWide) return;
        const el = cellRefs.current[i];
        const svg = el?.querySelector('[data-dropoff-svg="narrow"]');
        if (!svg) return;
        const r = svg.getBoundingClientRect();
        const overlay = computeNarrowSeamOverlay(
          r.width,
          r.height,
          col.riverMarker,
          col.height,
          n,
          col.kind === 'attention' ? 'attention' : 'critical',
        );
        if (overlay) nextOverlays[i] = overlay;
      });
      setSeamOverlays(nextOverlays);

      if (onColumnCentersMeasured) {
        const anchor = anchorRef?.current ?? root;
        const anchorRect = anchor.getBoundingClientRect();
        const centers = columns.map((_, i) => {
          const el = cellRefs.current[i];
          if (!el) return 0;
          const rect = el.getBoundingClientRect();
          return rect.left + rect.width / 2 - anchorRect.left;
        });
        const rights = columns.map((_, i) => {
          const el = cellRefs.current[i];
          if (!el) return 0;
          const rect = el.getBoundingClientRect();
          return rect.right - anchorRect.left;
        });
        const row = rowElRef.current;
        const totalWidth =
          row && (row.scrollWidth > 0 ? row.scrollWidth : row.offsetWidth)
            ? Math.max(row.scrollWidth, row.offsetWidth)
            : root.offsetWidth;
        onColumnCentersMeasured({ centers, rights, totalWidth });
      }
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

  useEffect(() => {
    cellRefs.current = cellRefs.current.slice(0, n);
  }, [n]);

  return (
    <div ref={chartRootRef} className="mx-auto flex min-w-0 w-full max-w-full flex-col gap-3 bg-transparent">
      <div className="flex items-baseline justify-between gap-6 px-0.5 text-[11px] font-medium tracking-tight text-[rgba(26,26,26,0.48)] tabular-nums">
        <p className="min-w-0 truncate">{startedLabel}</p>
        <p className="min-w-0 shrink-0 truncate text-right">{finishedLabel}</p>
      </div>

      <motion.div
        layout
        ref={rowElRef}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        className="relative grid w-full min-w-0 gap-0 overflow-visible"
        style={{ gridTemplateColumns: n > 0 ? `repeat(${n}, minmax(${gridMinPx}px, 1fr))` : undefined }}
        aria-label={`Drop-off across ${n} questions`}
      >
        {columns.map((col, i) => {
          const isMuted = filter !== 'all' && !matchesFilter(filter, col.kind);
          const isWide = col.riverMode === 'wide' && col.wide;
          const showDropUnderLabel = Boolean(col.drop) && (isWide || !col.alert);
          const y = CENTER_Y - col.height / 2;
          const isHovered = hoverIndex === i;
          const isSelected = selectedIndex === i;
          const colDelay = 0.04 + i * 0.025;
          const wideFillBase = 0.21;
          const wideFill = isHovered || isSelected ? Math.min(wideFillBase + 0.1, 0.36) : wideFillBase;
          const showSeamStack = !!(col.alert && col.drop && !isWide && seamOverlays[i]);

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
                    data-dropoff-svg="wide"
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
                    data-dropoff-svg="narrow"
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
                          opacity: 1,
                        }}
                        transition={{ duration: 0.45, delay: colDelay, ease: REVEAL_EASE }}
                        d={col.d}
                        fill={col.style.color}
                        fillOpacity={
                          isHovered || isSelected
                            ? Math.min(col.style.fill + 0.09, 0.38)
                            : col.style.fill
                        }
                        stroke={col.style.color}
                        strokeOpacity={Math.min(col.style.stroke + (isHovered || isSelected ? 0.1 : 0), 0.88)}
                        strokeWidth={isHovered || isSelected ? col.style.sw + 0.15 : col.style.sw}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </g>
                  </svg>
                )}
                {showSeamStack ? (
                  <div
                    className="pointer-events-none absolute top-7 left-full z-[4] w-0 overflow-visible"
                    style={{ height: CHART_H + TOP_LABEL_OFFSET }}
                    aria-hidden
                  >
                    <RiverSeamAlertStack
                      overlay={seamOverlays[i]}
                      drop={col.drop}
                      variant={col.kind === 'attention' ? 'attention' : 'critical'}
                    />
                  </div>
                ) : null}
              </div>

              <div className={`relative z-[1] ${padBottom} flex shrink-0 flex-col items-center justify-start gap-0.5 px-px`}>
                <span
                  className={`block w-full truncate py-2 text-[10px] font-medium md:text-[11px] ${
                    isSelected ? 'text-[#18181b]' : 'text-[rgba(0,0,0,0.52)] group-hover:text-[#27272a]'
                  }`}
                >
                  {col.q}
                </span>
                {showDropUnderLabel ? (
                  <span
                    className={`block w-full truncate text-[10px] font-normal tabular-nums md:text-[11px] ${
                      col.kind === 'attention'
                        ? 'text-[#B45309]'
                        : 'text-[#DC2626]'
                    }`}
                  >
                    {col.drop}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
