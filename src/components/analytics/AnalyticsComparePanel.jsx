import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import {
  RiCloseLine,
  RiCloseCircleLine,
  RiAddLine,
  RiCheckLine,
  RiBarChartBoxLine,
  RiTableLine,
} from 'react-icons/ri';
import { formatResponseCount } from '@/constants';
import {
  openAnalyticsComparePicker,
  toggleCompareForm,
} from '@/store/slices/uiSlice';
import CompareFormPickerModal from '@/components/ui/CompareFormPickerModal';
import TrendComparisonChart from './TrendComparisonChart';
import {
  CompareInsufficientResponsesEmpty,
  CompareNothingYetEmpty,
} from './compare/CompareAnalyticsEmptyStates';
import { isApiConfigured } from '@/config/env';

const METRIC_ROWS = [
  {
    metric: 'Total responses',
    a: '248',
    b: '312',
    c: '0',
    change: '↓ 20.5%',
    changeTone: 'bad',
  },
  {
    metric: 'Completion rate',
    a: '13.5%',
    b: '18.2%',
    c: '—',
    change: '↓ 4.7 pts',
    changeTone: 'bad',
  },
  {
    metric: 'High quality %',
    a: '63%',
    b: '58%',
    c: '—',
    change: '↑ 5 pts',
    changeTone: 'good',
  },
  {
    metric: 'Avg time on form',
    a: '2m 14s',
    b: '3m 02s',
    c: '—',
    change: '↑ 18s faster',
    changeTone: 'good',
  },
  {
    metric: 'Biggest drop-off Q',
    a: 'Q2 (34%)',
    b: 'Q4 (28%)',
    c: '—',
    change: '↓ Worse',
    changeTone: 'bad',
  },
  {
    metric: 'Avg quality score',
    a: '4.1 / 5',
    b: '3.8 / 5',
    c: '—',
    change: '↑ +0.3',
    changeTone: 'good',
  },
  {
    metric: 'Form lifecycle',
    a: '38d (active)',
    b: '90d (archived)',
    c: '—',
    change: '—',
    changeTone: 'neutral',
  },
];

const METRIC_OPTIONS = [
  { id: 'completion', label: 'Completion rate' },
  { id: 'responses', label: 'Responses / day' },
  { id: 'avgTime', label: 'Avg. time' },
];

const CHIP_ENTER_T = { type: 'spring', stiffness: 460, damping: 32, mass: 0.5 };
const CHIP_EXIT_T = { duration: 0.12, ease: [0.4, 0, 1, 1] };
const CHIP_LAYOUT_T = { type: 'spring', stiffness: 520, damping: 36, mass: 0.5 };
const CHIP_INITIAL = { opacity: 0, scale: 0.7, y: 2 };
const CHIP_ANIMATE = { opacity: 1, scale: 1, y: 0, transition: CHIP_ENTER_T };
const CHIP_EXIT = { opacity: 0, scale: 0.7, y: -2, transition: CHIP_EXIT_T };

const CARD_INITIAL = { opacity: 0, y: 10, scale: 0.97 };
const CARD_ANIMATE = { opacity: 1, y: 0, scale: 1 };
const CARD_EXIT = { opacity: 0, y: -8, scale: 0.97 };
const CARD_TRANSITION = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

const MENU_INITIAL = { opacity: 0, y: -6, scale: 0.97 };
const MENU_ANIMATE = { opacity: 1, y: 0, scale: 1 };
const MENU_EXIT = { opacity: 0, y: -4, scale: 0.97 };
const MENU_TRANSITION = { duration: 0.16, ease: [0.22, 1, 0.36, 1] };

function statusMeta(form) {
  if (!form)
    return { word: '—', dotClass: 'bg-[#a8a6a0]' };
  if (form.status === 'live')
    return { word: 'Live', dotClass: 'bg-[#75ba45]' };
  if (form.status === 'draft')
    return { word: 'Draft', dotClass: 'bg-[#a09d94]' };
  if (form.status === 'archived')
    return { word: 'Archived', dotClass: 'bg-[#a8a6a0]' };
  return { word: 'Live', dotClass: 'bg-[#75ba45]' };
}

function buildRowsFromCompareApi(compareApiData) {
  if (!compareApiData?.metrics?.length) return null;
  return compareApiData.metrics.map((m) => ({
    metric: m.label ?? m.id,
    a: m.unit === '%' ? `${m.value}%` : String(m.value ?? '—'),
    b: '—',
    c: '—',
    change: compareApiData.insight ?? '—',
    changeTone: 'neutral',
  }));
}

function AnalyticsComparePanel({
  currentForm,
  rangeLabel = 'All time',
  compareApiData = null,
  responseCount: responseCountProp,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const forms = useSelector((s) => s.forms.forms);
  const selectedFormIds = useSelector((s) => s.ui.compareMode.selectedFormIds);

  const [view, setView] = useState('chart');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [trendMetric, setTrendMetric] = useState('completion');
  const [selectedMetrics, setSelectedMetrics] = useState(() =>
    METRIC_OPTIONS.map((m) => m.id),
  );
  const [addMoreOpen, setAddMoreOpen] = useState(false);
  const addMoreRef = useRef(null);

  const toggleMetric = useCallback(
    (id) => {
      setSelectedMetrics((cur) => {
        if (cur.includes(id)) {
          if (cur.length === 1) return cur;
          const next = cur.filter((m) => m !== id);
          if (id === trendMetric) setTrendMetric(next[0]);
          return next;
        }
        return [...cur, id];
      });
    },
    [trendMetric],
  );

  useEffect(() => {
    if (!addMoreOpen) return undefined;
    const handler = (e) => {
      if (addMoreRef.current && !addMoreRef.current.contains(e.target)) {
        setAddMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [addMoreOpen]);

  const allSelected = selectedMetrics.length === METRIC_OPTIONS.length;

  const selectAllMetrics = useCallback(() => {
    setSelectedMetrics(METRIC_OPTIONS.map((m) => m.id));
  }, []);

  const collapseToActiveMetric = useCallback(() => {
    setSelectedMetrics([trendMetric]);
  }, [trendMetric]);

  const titleA = currentForm?.title ?? 'Current form';
  const { word: statusWord, dotClass: statusDotClass } = statusMeta(currentForm);
  const responsesN = responseCountProp ?? currentForm?.responses ?? 0;
  const responseStr = `${formatResponseCount(responsesN)} ${responsesN === 1 ? 'response' : 'responses'}`;

  const otherCompareForms = useMemo(() => {
    const cid = currentForm?.id;
    return selectedFormIds
      .filter((id) => id !== cid)
      .slice(0, 2)
      .map((id) => forms.find((f) => f.id === id))
      .filter(Boolean);
  }, [selectedFormIds, currentForm?.id, forms]);

  const workspaceHasCompareTarget = useMemo(
    () => forms.some((f) => f.id !== currentForm?.id),
    [forms, currentForm?.id],
  );

  const openPicker = useCallback(() => {
    if (currentForm?.id != null) {
      dispatch(openAnalyticsComparePicker({ formId: currentForm.id }));
    }
    setPickerOpen(true);
  }, [dispatch, currentForm]);

  const seriesBTitle = otherCompareForms[0]?.title ?? null;
  const useApiCompare = isApiConfigured() && compareApiData && !compareApiData.source;
  const apiRows = buildRowsFromCompareApi(compareApiData);
  const metricRowsForTable = isApiConfigured() ? (apiRows ?? []) : (apiRows ?? METRIC_ROWS);
  const showSingleFormLowData =
    compareApiData &&
    !compareApiData.source &&
    responsesN < 2 &&
    otherCompareForms.length === 0;

  if (showSingleFormLowData) {
    return (
      <CompareInsufficientResponsesEmpty
        responseCount={responsesN}
        className="mx-auto max-w-[1400px] border border-[#e8e8e5] shadow-sm"
      />
    );
  }

  return (
    <>
      <CompareFormPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />

      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        {!workspaceHasCompareTarget ? (
          <CompareNothingYetEmpty
            onCreateForm={() => navigate('/dashboard')}
            className="border border-[#e8e8e5] shadow-sm"
          />
        ) : null}

        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.65px] text-[#888780]">
            Select forms or folders to compare
          </p>
          <LayoutGroup id="compare-form-cards">
            <div className="flex flex-wrap gap-3">
              <motion.div
                layout
                transition={CARD_TRANSITION}
                className="flex min-w-[160px] max-w-[240px] flex-1 flex-col gap-1 rounded-[12px] border border-[#4b43b0] bg-[#eeedfe] py-[15px] pl-[17px] pr-[15px]"
              >
                <span className="text-[9px] font-bold uppercase leading-normal tracking-[0.81px] text-[#4b43b0]">
                  Current
                </span>
                <p className="truncate pr-5 text-[13.5px] font-medium leading-normal text-[#17160e]">{titleA}</p>
                <div className="flex min-w-0 items-center gap-[5px]">
                  <span className={`size-[7px] shrink-0 rounded-[3.5px] ${statusDotClass}`} aria-hidden />
                  <span className="truncate text-[11px] font-normal leading-normal text-[#646464]">
                    {statusWord}
                    {' · '}
                    {responseStr}
                  </span>
                </div>
              </motion.div>

              <AnimatePresence mode="popLayout" initial={false}>
                {otherCompareForms.map((form, idx) => {
                  const slot = idx === 0 ? 'Compare A' : 'Compare B';
                  const sm = statusMeta(form);
                  const rn = form.responses ?? 0;
                  const rs = `${formatResponseCount(rn)} ${rn === 1 ? 'response' : 'responses'}`;
                  return (
                    <motion.div
                      key={form.id}
                      layout
                      initial={CARD_INITIAL}
                      animate={CARD_ANIMATE}
                      exit={CARD_EXIT}
                      transition={CARD_TRANSITION}
                      className="relative flex min-w-[160px] max-w-[220px] flex-1 flex-col rounded-[10px] border border-[#e5e3dc] bg-white p-4 shadow-sm"
                    >
                      <button
                        type="button"
                        className="absolute top-3 right-3 cursor-pointer text-[#a8a6a0] transition-colors hover:text-[#393939]"
                        aria-label={`Remove ${form.title}`}
                        onClick={() => dispatch(toggleCompareForm(form.id))}
                      >
                        <RiCloseLine size={16} />
                      </button>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#a8a6a0]">{slot}</span>
                      <p className="mt-1 truncate text-[14px] font-semibold text-[#1a1a1c]">{form.title}</p>
                      <p className="mt-2 text-[12px] text-[#6b6966]">
                        <span className={`inline-block size-[7px] rounded-full align-middle ${sm.dotClass}`} />{' '}
                        {sm.word} · {rs}
                      </p>
                    </motion.div>
                  );
                })}

                {otherCompareForms.length < 1 ? (
                  <motion.button
                    key="add-form-cta"
                    type="button"
                    layout
                    initial={CARD_INITIAL}
                    animate={CARD_ANIMATE}
                    exit={CARD_EXIT}
                    transition={CARD_TRANSITION}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openPicker}
                    className="flex min-h-[120px] min-w-[160px] max-w-[220px] flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-[#d8d6d0] bg-[#fafaf8] py-8 text-[13px] font-medium text-[#6b6966] transition-colors hover:border-[#c9c7bf] hover:bg-[#f4f3ef]"
                  >
                    <RiAddLine size={20} />
                    Add form
                  </motion.button>
                ) : null}
              </AnimatePresence>
            </div>
          </LayoutGroup>
        </div>

        <div>
          <div className="mb-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.65px] text-[#888780]">
              Select metrics to compare
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <LayoutGroup id="view-toggle">
                <div className="relative flex overflow-hidden rounded-[8px] border border-[#e5e3dc] bg-[#f4f3ef] p-0.5">
                  {[
                    { id: 'chart', label: 'Chart', Icon: RiBarChartBoxLine },
                    { id: 'table', label: 'Table', Icon: RiTableLine },
                  ].map(({ id, label, Icon }) => {
                    const active = view === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setView(id)}
                        className={`relative z-[1] flex cursor-pointer items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-medium transition-colors duration-200 ${
                          active ? 'text-white' : 'text-[#646464] hover:text-[#1a1a1c]'
                        }`}
                      >
                        {active ? (
                          <motion.span
                            layoutId="view-toggle-indicator"
                            className="absolute inset-0 -z-[1] rounded-[6px] bg-[#17160e]"
                            transition={{ type: 'spring', stiffness: 460, damping: 36, mass: 0.6 }}
                          />
                        ) : null}
                        <Icon size={14} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </LayoutGroup>
            </div>
          </div>
          <LayoutGroup id="metric-chips">
            <div className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {allSelected ? (
                  <motion.span
                    key="all-metrics-chip"
                    layout
                    initial={CHIP_INITIAL}
                    animate={CHIP_ANIMATE}
                    exit={CHIP_EXIT}
                    transition={CHIP_LAYOUT_T}
                    className="inline-flex h-[32px] items-center gap-1 rounded-[99px] border border-[#17160e] bg-[#17160e] px-3 text-[11.5px] font-medium text-white"
                  >
                    All metrics
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.85 }}
                      onClick={collapseToActiveMetric}
                      aria-label="Clear All metrics"
                      className="flex cursor-pointer items-center justify-center text-white/80 transition-colors hover:text-white"
                    >
                      <RiCloseCircleLine size={12} />
                    </motion.button>
                  </motion.span>
                ) : null}

                {selectedMetrics.map((id) => {
                  const opt = METRIC_OPTIONS.find((m) => m.id === id);
                  if (!opt) return null;
                  const removeDisabled = selectedMetrics.length === 1;
                  return (
                    <motion.span
                      key={id}
                      layout
                      initial={CHIP_INITIAL}
                      animate={CHIP_ANIMATE}
                      exit={CHIP_EXIT}
                      transition={CHIP_LAYOUT_T}
                      className="inline-flex h-[32px] items-center gap-1 rounded-[99px] border border-[#17160e] bg-[#17160e] px-3 text-[11.5px] font-medium text-white"
                    >
                      {opt.label}
                      <motion.button
                        type="button"
                        whileTap={{ scale: removeDisabled ? 1 : 0.85 }}
                        onClick={() => toggleMetric(id)}
                        aria-label={`Remove ${opt.label}`}
                        className="flex cursor-pointer items-center justify-center text-white/80 transition-colors hover:text-white disabled:cursor-not-allowed disabled:text-white/30"
                        disabled={removeDisabled}
                      >
                        <RiCloseCircleLine size={12} />
                      </motion.button>
                    </motion.span>
                  );
                })}

                <motion.div
                  key="add-more-trigger"
                  layout
                  className="relative"
                  ref={addMoreRef}
                  transition={CHIP_LAYOUT_T}
                >
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setAddMoreOpen((o) => !o)}
                    aria-haspopup="menu"
                    aria-expanded={addMoreOpen}
                    className="inline-flex h-[32px] cursor-pointer items-center rounded-[99px] border border-[#8e8c86] bg-transparent px-3 text-[11.5px] font-normal text-[#646464] transition-colors hover:bg-[#fafaf8]"
                  >
                    + Add more
                  </motion.button>
                  <AnimatePresence>
                    {addMoreOpen ? (
                      <motion.div
                        key="add-more-menu"
                        role="menu"
                        initial={MENU_INITIAL}
                        animate={MENU_ANIMATE}
                        exit={MENU_EXIT}
                        transition={MENU_TRANSITION}
                        style={{ transformOrigin: 'top left' }}
                        className="absolute left-0 top-[calc(100%+6px)] z-20 min-w-[180px] rounded-[8px] border border-[rgba(0,0,0,0.08)] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                      >
                        <button
                          type="button"
                          role="menuitemcheckbox"
                          aria-checked={allSelected}
                          onClick={allSelected ? collapseToActiveMetric : selectAllMetrics}
                          className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[12px] font-medium text-[#1a1a1c] transition-colors hover:bg-[#f4f3ef]"
                        >
                          <span>All metrics</span>
                          <AnimatePresence initial={false} mode="wait">
                            {allSelected ? (
                              <motion.span
                                key="check"
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.6 }}
                                transition={{ duration: 0.12 }}
                                className="flex"
                              >
                                <RiCheckLine size={14} className="text-[#17160e]" />
                              </motion.span>
                            ) : (
                              <span key="spacer" className="size-[14px]" aria-hidden />
                            )}
                          </AnimatePresence>
                        </button>
                        <div className="mx-2 my-1 h-px bg-[rgba(0,0,0,0.06)]" aria-hidden />
                        {METRIC_OPTIONS.map((opt) => {
                          const checked = selectedMetrics.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              role="menuitemcheckbox"
                              aria-checked={checked}
                              onClick={() => toggleMetric(opt.id)}
                              className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[12px] text-[#393939] transition-colors hover:bg-[#f4f3ef]"
                            >
                              <span>{opt.label}</span>
                              <AnimatePresence initial={false} mode="wait">
                                {checked ? (
                                  <motion.span
                                    key="check"
                                    initial={{ opacity: 0, scale: 0.6 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.6 }}
                                    transition={{ duration: 0.12 }}
                                    className="flex"
                                  >
                                    <RiCheckLine size={14} className="text-[#17160e]" />
                                  </motion.span>
                                ) : (
                                  <span key="spacer" className="size-[14px]" aria-hidden />
                                )}
                              </AnimatePresence>
                            </button>
                          );
                        })}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              </AnimatePresence>
            </div>
          </LayoutGroup>
        </div>

        <AnimatePresence mode="wait" initial={false}>
        {view === 'chart' ? (
          <motion.div
            key="chart-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <TrendComparisonChart
              seriesATitle={titleA}
              seriesBTitle={seriesBTitle}
              trendMetric={trendMetric}
              onTrendMetricChange={setTrendMetric}
              selectedMetrics={selectedMetrics}
              onOpenComparePicker={workspaceHasCompareTarget ? openPicker : undefined}
              workspaceHasCompareTarget={workspaceHasCompareTarget}
              metricHasNoTrendData={useApiCompare && !(compareApiData?.series?.length)}
              rangeLabel={rangeLabel}
              compareDailySeries={useApiCompare ? compareApiData.series : null}
            />
          </motion.div>
        ) : (
          <motion.div
            key="table-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-[12px] border border-[#e5e3dc] bg-white shadow-sm"
          >
            <div className="flex items-center border-b border-[#e5e3dc] bg-[#fafaf8] px-4 py-3">
              <span className="text-[13px] font-semibold text-[#1a1a1c]">Detailed metric comparison</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#e5e3dc] bg-[#fcfcfb]">
                    <th className="px-4 py-2.5 text-left font-semibold text-[#6b6966]">Metric</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-[#6b6966]">{titleA} (current)</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-[#6b6966]">
                      {otherCompareForms[0]?.title ?? 'Compare A'}
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-[#6b6966]">
                      {otherCompareForms[1]?.title ?? 'Compare B'}
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-[#6b6966]">Change (vs first compare)</th>
                  </tr>
                </thead>
                <tbody>
                  {metricRowsForTable.map((row) => (
                    <tr key={row.metric} className="border-b border-[#f4f3ef] hover:bg-[#fcfcfb]">
                      <td className="px-4 py-2.5 font-medium text-[#393939]">{row.metric}</td>
                      <td
                        className={`px-4 py-2.5 ${
                          row.metric === 'Completion rate' ? 'font-medium text-[#fb1a00]' : 'text-[#393939]'
                        }`}
                      >
                        {row.a}
                      </td>
                      <td className="px-4 py-2.5 text-[#393939]">{row.b}</td>
                      <td className="px-4 py-2.5 text-[#a8a6a0]">{row.c}</td>
                      <td
                        className={`px-4 py-2.5 font-medium ${
                          row.changeTone === 'good'
                            ? 'text-[#16a34a]'
                            : row.changeTone === 'bad'
                              ? 'text-[#dc2626]'
                              : 'text-[#6b6966]'
                        }`}
                      >
                        {row.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default AnalyticsComparePanel;
