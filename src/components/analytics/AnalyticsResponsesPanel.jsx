import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateForm } from '@/store/slices/formsSlice';
import { AnimatePresence, motion } from 'motion/react';
import { fetchFormResponses } from '@/api/services/analyticsService';
import { getBuilderSnapshot } from '@/api/services/formsService';
import { isApiConfigured } from '@/config/env';
import { useSmartPolling } from '@/hooks/useSmartPolling';
import {
  RiSearchLine,
  RiTimeLine,
  RiCalendarLine,
  RiArrowDownSLine,
  RiExpandDiagonalLine,
  RiListCheck2,
  RiChat3Line,
} from 'react-icons/ri';
import { selectFormResponses } from '@/store/slices/formsSlice';
import { readBuilderDraft } from '@/features/forms/utils/builderDraftStorage';
import {
  buildResponseTableHeaders,
  responseToTableRow,
  filterResponsesByRange,
  mapApiResponseForDisplay,
  cellDisplayText,
  responsesExportToCsv,
} from '@/features/forms/utils/formResponseBuilder';
import ResponseUploadCell from './ResponseUploadCell';
import CustomRangeDatePicker, { formatCustomRangeLabel } from './CustomRangeDatePicker';
import AnalyticsResponseDetailDrawer from './AnalyticsResponseDetailDrawer';

/** Fixed columns that appear before the form's question columns. */
const FIXED_HEADERS = [
  { label: 'Name, email, or phone', Icon: null, iconBg: null },
  { label: 'Response time', Icon: RiTimeLine, iconBg: '#E8F4FC' },
  { label: 'Response type', Icon: RiChat3Line, iconBg: '#FFF0E6' },
];

const RANGE_OPTIONS = [
  'All time',
  'Last 7 days',
  'Last 30 days',
  'Last 90 days',
  'This quarter',
  'Custom range…',
];

const CUSTOM_OPTION = 'Custom range…';

const COL_STYLE = { width: 213, minWidth: 200 };

const TABLE_BORDER = 'border-[#ebe7e0]';
const TABLE_HEAD_BG = 'bg-[#fafaf9]';

function splitDateTimeDisplay(value) {
  const s = String(value).trim();
  const m = s.match(/^(.+)\s+(\d{1,2}:\d{2})$/);
  if (m) return { line1: m[1], line2: m[2] };
  return { line1: s, line2: null };
}

function renderCellContent(cell, ci) {
  if (cell && typeof cell === 'object' && cell.type === 'upload') {
    return (
      <ResponseUploadCell
        files={cell.files}
        value={cell.value}
        compact
      />
    );
  }
  if (ci === 2) {
    return (
      <span className="inline-flex w-fit max-w-full rounded-[8px] border border-[#d8eadf] bg-[#f4fbf7] px-2.5 py-1 text-[13px] font-medium leading-snug text-[#3d7d4e]">
        {cell}
      </span>
    );
  }
  if (ci === 1) {
    const { line1, line2 } = splitDateTimeDisplay(cell);
    return (
      <div className="flex flex-col gap-0.5 font-mono text-[13px] font-normal leading-normal text-[#8a8880]">
        <span>{line1}</span>
        {line2 ? <span>{line2}</span> : null}
      </div>
    );
  }
  return (
    <span className="max-w-full break-words text-[13px] leading-snug text-[#5c5c58]">{cell}</span>
  );
}

function AnalyticsResponsesPanel({ form, rangeLabel, onRangeChange }) {
  const dispatch = useDispatch();
  const storedResponses = useSelector((state) => selectFormResponses(state, form?.id));
  const [apiResponses, setApiResponses] = useState(null);
  const [apiTotal, setApiTotal] = useState(null);
  const [fetchedSnapshot, setFetchedSnapshot] = useState(null);

  useEffect(() => {
    if (!isApiConfigured() || !form?.id) {
      setFetchedSnapshot(null);
      return;
    }
    const fromForm = form?.publishedSnapshot ?? form?.builderSnapshot;
    if (fromForm?.screens?.length) {
      setFetchedSnapshot(null);
      return;
    }
    let cancelled = false;
    getBuilderSnapshot(form.id)
      .then((data) => {
        const snap = data?.snapshot ?? data;
        if (!cancelled && snap?.screens?.length) setFetchedSnapshot(snap);
      })
      .catch(() => {
        if (!cancelled) setFetchedSnapshot(null);
      });
    return () => {
      cancelled = true;
    };
  }, [form?.id, form?.builderSnapshot, form?.publishedSnapshot]);

  const loadApiResponses = useCallback(
    async ({ silent = false } = {}) => {
      if (!isApiConfigured() || !form?.id) return;
      const rangeParam =
        rangeLabel === 'Last 7 days'
          ? '7d'
          : rangeLabel === 'Last 30 days'
            ? '30d'
            : rangeLabel === 'Last 90 days'
              ? '90d'
              : 'all';
      try {
        const data = await fetchFormResponses(form.id, { range: rangeParam });
        if (Array.isArray(data?.items)) {
          setApiResponses(data.items);
          const total =
            typeof data.total === 'number' ? data.total : data.items.length;
          setApiTotal(total);
          if (rangeParam === 'all' && form?.id != null) {
            dispatch(updateForm({ id: form.id, changes: { responses: total } }));
          }
        }
      } catch (err) {
        if (!silent) {
          setApiResponses([]);
          setApiTotal(0);
        }
        throw err;
      }
    },
    [form?.id, rangeLabel, dispatch],
  );

  useEffect(() => {
    if (!isApiConfigured() || !form?.id) {
      setApiResponses(null);
      setApiTotal(null);
      return;
    }
    loadApiResponses().catch(() => {});
  }, [form?.id, rangeLabel, loadApiResponses]);

  // Background refresh so new submissions appear without a manual reload.
  const pollApiResponses = useCallback(
    () => loadApiResponses({ silent: true }),
    [loadApiResponses],
  );
  useSmartPolling(pollApiResponses, {
    intervalMs: 20_000,
    enabled: isApiConfigured() && Boolean(form?.id),
  });

  const [search, setSearch] = useState('');
  const [localRangeOpen, setLocalRangeOpen] = useState(false);
  const [customPickerOpen, setCustomPickerOpen] = useState(false);
  const [localRange, setLocalRange] = useState(rangeLabel ?? 'All time');
  const [lastCustomRange, setLastCustomRange] = useState({ start: null, end: null });

  const draft = useMemo(() => {
    const fromForm = form?.publishedSnapshot ?? form?.builderSnapshot;
    if (fromForm?.screens?.length) return fromForm;
    if (fetchedSnapshot?.screens?.length) return fetchedSnapshot;
    if (!isApiConfigured() && form?.id != null) {
      const local = readBuilderDraft(form.id);
      if (local?.screens?.length) return local;
    }
    return fromForm ?? fetchedSnapshot ?? null;
  }, [form?.id, form?.builderSnapshot, form?.publishedSnapshot, fetchedSnapshot]);

  const responses = useMemo(() => {
    const raw = isApiConfigured() ? (apiResponses ?? []) : (storedResponses ?? []);
    if (!isApiConfigured() || !draft?.screens?.length) return raw;
    return raw.map((item) => mapApiResponseForDisplay(item, draft));
  }, [apiResponses, storedResponses, draft]);

  const HEADERS = useMemo(() => {
    const built = buildResponseTableHeaders(draft, RiListCheck2);
    return built.length > FIXED_HEADERS.length
      ? built
      : [
          ...FIXED_HEADERS,
          {
            label: 'Add questions in the form builder to see answer columns',
            Icon: RiListCheck2,
            iconBg: '#F5F3FF',
          },
        ];
  }, [draft]);

  const responsesInRange = useMemo(
    () => filterResponsesByRange(responses, localRange, lastCustomRange),
    [responses, localRange, lastCustomRange],
  );

  const FORM_ROWS = useMemo(
    () => responsesInRange.map((response) => responseToTableRow(response)),
    [responsesInRange],
  );

  const totalResponses =
    isApiConfigured() && apiTotal != null ? apiTotal : responses.length;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [columnOrder, setColumnOrder] = useState(() => HEADERS.map((_, i) => i));
  const [firstColMenuOpen, setFirstColMenuOpen] = useState(false);
  const [colMenuBox, setColMenuBox] = useState(null);

  /** Re-sync the column order whenever the form (and therefore HEADERS length) changes. */
  useEffect(() => {
    setColumnOrder(HEADERS.map((_, i) => i));
  }, [HEADERS]);

  const wrapRef = useRef(null);
  const leadHeaderRef = useRef(null);
  const colMenuPortalRef = useRef(null);

  useEffect(() => {
    if (rangeLabel != null) setLocalRange(rangeLabel);
  }, [rangeLabel]);

  useEffect(() => {
    if (!localRangeOpen && !customPickerOpen) return undefined;
    const onDocMouseDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setLocalRangeOpen(false);
        setCustomPickerOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLocalRangeOpen(false);
        setCustomPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [localRangeOpen, customPickerOpen]);

  const updateColMenuBox = useCallback(() => {
    if (!firstColMenuOpen || !leadHeaderRef.current) return;
    const r = leadHeaderRef.current.getBoundingClientRect();
    setColMenuBox({
      top: r.bottom + 6,
      left: r.left,
      width: Math.min(320, Math.max(220, window.innerWidth - r.left - 16)),
    });
  }, [firstColMenuOpen]);

  useLayoutEffect(() => {
    if (!firstColMenuOpen) {
      setColMenuBox(null);
      return undefined;
    }
    updateColMenuBox();
    window.addEventListener('resize', updateColMenuBox);
    window.addEventListener('scroll', updateColMenuBox, true);
    return () => {
      window.removeEventListener('resize', updateColMenuBox);
      window.removeEventListener('scroll', updateColMenuBox, true);
    };
  }, [firstColMenuOpen, updateColMenuBox]);

  useEffect(() => {
    if (!firstColMenuOpen) return undefined;
    const onDocMouseDown = (e) => {
      const t = e.target;
      if (
        leadHeaderRef.current?.contains(t) ||
        colMenuPortalRef.current?.contains(t)
      ) {
        return;
      }
      setFirstColMenuOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setFirstColMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [firstColMenuOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return FORM_ROWS;
    const q = search.toLowerCase();
    return FORM_ROWS.filter((row) =>
      row.some((cell) => cellDisplayText(cell).toLowerCase().includes(q)),
    );
  }, [search, FORM_ROWS]);

  // Parallel to `filtered` — keeps raw response objects in sync with display rows for feedback.
  const filteredResponseItems = useMemo(() => {
    if (!search.trim()) return responsesInRange;
    const q = search.toLowerCase();
    return responsesInRange.filter((_, i) =>
      FORM_ROWS[i]?.some((cell) => cellDisplayText(cell).toLowerCase().includes(q)),
    );
  }, [search, FORM_ROWS, responsesInRange]);

  useEffect(() => {
    setSelectedRowIndex((i) => {
      if (filtered.length === 0) return 0;
      return Math.min(i, filtered.length - 1);
    });
  }, [filtered]);

  useEffect(() => {
    if (filtered.length === 0) setDrawerOpen(false);
  }, [filtered.length]);

  const pickLeadColumn = (k) => {
    setColumnOrder((order) => [k, ...order.filter((i) => i !== k)]);
    setFirstColMenuOpen(false);
    setColMenuBox(null);
  };

  const leadIndex = columnOrder[0];

  const colMenuPortal = createPortal(
    <AnimatePresence>
      {firstColMenuOpen && colMenuBox ? (
        <motion.div
          ref={colMenuPortalRef}
          key="col-picker-portal"
          role="listbox"
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed',
            top: colMenuBox.top,
            left: colMenuBox.left,
            width: colMenuBox.width,
            zIndex: 200,
          }}
          className="max-h-[min(360px,70vh)] overflow-y-auto rounded-[12px] border border-[#e8e6e0] bg-white py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
        >
          {HEADERS.map((opt, ki) => {
            const OIcon = opt.Icon;
            const selected = ki === leadIndex;
            return (
              <button
                key={opt.label}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => pickLeadColumn(ki)}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-150 ${
                  selected ? 'bg-[#f4f3f0]' : 'hover:bg-[#fafaf8]'
                }`}
              >
                {OIcon ? (
                  <span
                    className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-[#5c5c58]"
                    style={{ backgroundColor: opt.iconBg ?? '#f0f0ed' }}
                  >
                    <OIcon size={14} aria-hidden />
                  </span>
                ) : (
                  <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-[#f0f0ed] text-[11px] font-semibold text-[#7a7874]">
                    @
                  </span>
                )}
                <span
                  className={`min-w-0 flex-1 truncate text-[13px] leading-snug ${
                    selected ? 'font-semibold text-[#1a1916]' : 'font-normal text-[#555]'
                  }`}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );

  const pickPreset = (opt) => {
    if (opt === CUSTOM_OPTION) {
      setLocalRangeOpen(false);
      setCustomPickerOpen(true);
      return;
    }
    setLocalRange(opt);
    setLocalRangeOpen(false);
    onRangeChange?.(opt);
  };

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-5 py-2 border-b border-[rgba(0,0,0,0.08)]">
        <div className="relative h-[30px] w-[185px] rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-[#f4f3f0]">
          <RiSearchLine
            className="absolute left-[11px] top-1/2 -translate-y-1/2 text-[#a0a09a] pointer-events-none"
            size={12}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search responses"
            className="w-full h-full pl-[30px] pr-[11px] rounded-[12px] bg-transparent text-[12.5px] text-[#1a1a1c] placeholder-[#a0a09a] outline-none"
          />
        </div>
        <div className="relative flex flex-wrap items-start gap-2" ref={wrapRef}>
          <button
            type="button"
            onClick={() => {
              if (customPickerOpen) {
                setCustomPickerOpen(false);
                return;
              }
              setLocalRangeOpen((o) => !o);
            }}
            className="flex items-center gap-[6px] h-[30px] pl-[10px] pr-[9px] rounded-[8px] border border-[rgba(0,0,0,0.08)] bg-white text-[12.5px] text-[#5c5c58] hover:bg-[#fafaf8] cursor-pointer max-w-[min(280px,calc(100vw-48px))]"
          >
            <RiCalendarLine size={13} className="shrink-0 text-[#7a7874]" aria-hidden />
            <span className="truncate">{localRange}</span>
            <RiArrowDownSLine
              size={12}
              className={`shrink-0 text-[#9a978f] transition-transform duration-200 ${
                localRangeOpen || customPickerOpen ? 'rotate-180' : ''
              }`}
              aria-hidden
            />
          </button>

          <AnimatePresence>
            {localRangeOpen && (
              <motion.div
                key="range-menu"
                role="menu"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute left-0 top-[calc(100%+6px)] z-20 w-[200px] rounded-[12px] border border-[#e8e6e0] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden"
              >
                {RANGE_OPTIONS.map((opt, i) => {
                  const selected =
                    opt === CUSTOM_OPTION
                      ? localRange !== opt &&
                        !RANGE_OPTIONS.slice(0, -1).includes(localRange)
                      : opt === localRange;
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="menuitem"
                      onClick={() => pickPreset(opt)}
                      className={`w-full text-left px-4 py-[10px] text-[12px] leading-[18px] cursor-pointer hover:bg-[#fafaf8] transition-colors duration-150 ${
                        i < RANGE_OPTIONS.length - 1 ? 'border-b border-[#e8e6e0]' : ''
                      } ${selected ? 'font-semibold text-[#1a1916]' : 'font-normal text-[#6b6860]'}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {customPickerOpen && (
              <motion.div
                key="custom-picker"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-0 top-[calc(100%+8px)] z-[25] max-w-[calc(100vw-2rem)]"
              >
                <CustomRangeDatePicker
                  initialStart={lastCustomRange.start}
                  initialEnd={lastCustomRange.end}
                  onCancel={() => setCustomPickerOpen(false)}
                  onApply={({ start, end }) => {
                    const label = formatCustomRangeLabel(start, end);
                    setLastCustomRange({ start, end });
                    setLocalRange(label);
                    setCustomPickerOpen(false);
                    onRangeChange?.(label);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="rounded-[14px] border border-[#e4e1d9] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto rounded-[14px]">
          <table className="table-fixed w-full min-w-[1400px] border-separate border-spacing-0 text-left text-[13px]">
            <colgroup>
              {columnOrder.map((ci) => (
                <col key={ci} style={COL_STYLE} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {columnOrder.map((ci, oi) => {
                  const h = HEADERS[ci];
                  const Icon = h.Icon;
                  const isLead = oi === 0;

                  if (isLead) {
                    return (
                      <th
                        key={ci}
                        scope="col"
                        className={`h-20 min-h-[80px] border-b ${TABLE_BORDER} border-r ${TABLE_BORDER} ${TABLE_HEAD_BG} align-top font-medium text-[#6b6860] rounded-tl-[12px] box-border`}
                      >
                        <button
                          ref={leadHeaderRef}
                          type="button"
                          className="flex h-full min-h-[80px] w-full flex-col justify-between gap-1.5 px-[14px] py-[11.5px] text-left outline-none transition-colors rounded-tl-[12px] hover:bg-[#f3f2ef] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(74,79,237,0.25)]"
                          aria-expanded={firstColMenuOpen}
                          aria-haspopup="listbox"
                          aria-label="Choose column to show first"
                          onClick={() => setFirstColMenuOpen((o) => !o)}
                        >
                          <div
                            className={`flex min-h-0 w-full items-start gap-2 ${
                              Icon ? 'flex-row' : 'flex-col'
                            }`}
                          >
                            {Icon ? (
                              <>
                                <span
                                  className="flex size-[22px] shrink-0 items-center justify-center rounded-[6px] text-[#5c5c58]"
                                  style={{ backgroundColor: h.iconBg }}
                                >
                                  <Icon size={12} className="shrink-0" aria-hidden />
                                </span>
                                <span className="min-w-0 flex-1 truncate text-left text-[13px] font-medium leading-snug text-[#555]">
                                  {h.label}
                                </span>
                              </>
                            ) : (
                              <span className="w-full max-w-full truncate text-left text-[13px] font-medium leading-snug text-[#555]">
                                {h.label}
                              </span>
                            )}
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 text-[#6b6860]">
                            <span className="text-[11px] font-medium text-[#5c5c58]">Show first</span>
                            <RiArrowDownSLine
                              size={12}
                              className={`shrink-0 opacity-90 transition-transform duration-200 ${
                                firstColMenuOpen ? 'rotate-180' : ''
                              }`}
                              aria-hidden
                            />
                          </span>
                        </button>
                      </th>
                    );
                  }

                  return (
                    <th
                      key={ci}
                      scope="col"
                      className={`h-20 min-h-[80px] border-b ${TABLE_BORDER} border-r ${TABLE_BORDER} ${TABLE_HEAD_BG} align-top font-medium text-[#6b6860] box-border ${
                        oi === columnOrder.length - 1 ? 'rounded-tr-[12px] border-r-0' : ''
                      }`}
                    >
                      <div className="flex h-full min-h-[80px] flex-col justify-between gap-1.5 px-[14px] py-[11.5px]">
                        <div
                          className={`flex min-h-0 w-full items-start gap-2 ${
                            Icon ? 'flex-row' : 'flex-col'
                          }`}
                        >
                          {Icon ? (
                            <>
                              <span
                                className="flex size-[22px] shrink-0 items-center justify-center rounded-[6px] text-[#5c5c58]"
                                style={{ backgroundColor: h.iconBg }}
                              >
                                <Icon size={12} className="shrink-0" aria-hidden />
                              </span>
                              <span className="min-w-0 flex-1 text-left text-[13px] leading-snug line-clamp-3 text-[#555]">
                                {h.label}
                              </span>
                            </>
                          ) : (
                            <span className="w-full max-w-full text-left text-[13px] leading-snug line-clamp-3 text-[#555]">
                              {h.label}
                            </span>
                          )}
                        </div>
                        <span className="inline-flex shrink-0 items-center text-[#b8b5ac]">
                          <RiArrowDownSLine size={12} className="opacity-90" aria-hidden />
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={HEADERS.length}
                    className={`border-b ${TABLE_BORDER} px-[14px] py-10 text-center text-[13px] text-[#6b6860] bg-white rounded-b-[12px]`}
                  >
                    {totalResponses === 0
                      ? 'No responses yet. Complete a preview submission in the form builder or share your live form to collect answers.'
                      : search.trim()
                        ? 'No responses match your search. Try a different keyword.'
                        : 'No responses in this date range. Try a different range.'}
                  </td>
                </tr>
              ) : (
                filtered.map((row, ri) => {
                  const lastOi = columnOrder.length - 1;
                  return (
                    <tr
                      key={ri}
                      tabIndex={0}
                      role="button"
                      aria-label={`Select response ${ri + 1}`}
                      className={`group relative bg-white transition-colors duration-200 ease-out hover:bg-[#f6f5f2] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(74,79,237,0.25)] ${
                        selectedRowIndex === ri
                          ? 'bg-[#f8f7f4] ring-1 ring-inset ring-[#e0dcd3]'
                          : ''
                      }`}
                      onClick={() => setSelectedRowIndex(ri)}
                      onDoubleClick={() => {
                        setSelectedRowIndex(ri);
                        setDrawerOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedRowIndex(ri);
                        }
                      }}
                    >
                      {columnOrder.map((ci, oi) => {
                        const cell = row[ci];
                        const isLastCol = oi === lastOi;
                        const isFirstCol = oi === 0;
                        return (
                          <td
                            key={ci}
                            className={`h-20 min-h-[80px] border-b ${TABLE_BORDER} border-r ${TABLE_BORDER} align-top box-border text-[#5c5c58] ${
                              isFirstCol ? 'relative' : ''
                            } ${isLastCol ? 'border-r-0' : ''} ${ri === filtered.length - 1 ? 'border-b-0' : ''} ${
                              ri === filtered.length - 1 && oi === 0
                                ? 'rounded-bl-[12px]'
                                : ''
                            } ${
                              ri === filtered.length - 1 && isLastCol
                                ? 'rounded-br-[12px]'
                                : ''
                            }`}
                          >
                            <div
                              className={`flex h-full min-h-[80px] flex-col justify-start px-[14px] py-[11.5px] ${
                                isFirstCol ? 'pb-10 pr-11' : ''
                              }`}
                            >
                              {renderCellContent(cell, ci)}
                              {isFirstCol ? (
                                <div className="group/expand pointer-events-none absolute bottom-2.5 right-2.5 z-10 opacity-0 translate-y-0.5 transition-[opacity,transform] duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0 focus-within:pointer-events-auto focus-within:opacity-100 focus-within:translate-y-0">
                                  <motion.span
                                    aria-hidden
                                    initial={false}
                                    className="pointer-events-none absolute bottom-[calc(100%+6px)] right-1/2 translate-x-1/2 whitespace-nowrap rounded-[6px] bg-[#17160e] px-2 py-[5px] text-[11px] font-medium leading-none text-white opacity-0 scale-[0.92] origin-bottom shadow-[0_4px_12px_rgba(0,0,0,0.18)] transition-[opacity,transform] duration-150 ease-out group-hover/expand:opacity-100 group-hover/expand:scale-100 group-focus-within/expand:opacity-100 group-focus-within/expand:scale-100"
                                  >
                                    View response
                                    <span
                                      aria-hidden
                                      className="absolute left-1/2 top-full -translate-x-1/2 size-0 border-x-[4px] border-x-transparent border-t-[4px] border-t-[#17160e]"
                                    />
                                  </motion.span>
                                  <motion.button
                                    type="button"
                                    aria-label="View response"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.94 }}
                                    transition={{ type: 'spring', stiffness: 480, damping: 26 }}
                                    className="flex size-[26px] items-center justify-center rounded-[6px] border border-[rgba(0,0,0,0.08)] bg-white text-[#5c5c58] shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-[border-color,box-shadow] duration-200 ease-out hover:border-[#c9c4ba] hover:shadow-[0_2px_10px_rgba(0,0,0,0.08)] outline-none focus-visible:ring-2 focus-visible:ring-[rgba(74,79,237,0.35)] cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedRowIndex(ri);
                                      setDrawerOpen(true);
                                    }}
                                  >
                                    <RiExpandDiagonalLine size={12} aria-hidden />
                                  </motion.button>
                                </div>
                              ) : null}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div
          className={`rounded-b-[14px] border-t ${TABLE_BORDER} px-4 py-3 text-[13px] text-[#6b6966] bg-[#fafaf9]`}
        >
          {totalResponses === 0
            ? '0 responses'
            : filtered.length === totalResponses
              ? `${filtered.length} response${filtered.length === 1 ? '' : 's'}`
              : `${filtered.length} of ${totalResponses} responses`}
        </div>
      </div>

      {filtered.length > 0 && (
        <AnalyticsResponseDetailDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          row={filtered[selectedRowIndex]}
          responseItem={filteredResponseItems[selectedRowIndex]}
          formId={form?.id}
          rowIndex={selectedRowIndex}
          totalRows={filtered.length}
          onPrev={() => setSelectedRowIndex((i) => Math.max(0, i - 1))}
          onNext={() =>
            setSelectedRowIndex((i) => Math.min(filtered.length - 1, i + 1))
          }
          headers={HEADERS}
        />
      )}
      {colMenuPortal}
    </div>
  );
}

export default AnalyticsResponsesPanel;
