import { useMemo, useTransition } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { SelectFormToCompareEmpty, TrendMetricNoDataEmpty } from './compare/CompareAnalyticsEmptyStates';
import TrendComparisonLinePlot from './TrendComparisonLinePlot';

const TAB_SPRING = { type: 'spring', stiffness: 420, damping: 32, mass: 0.55 };
const TAB_INITIAL = { opacity: 0, scale: 0.85, y: 2 };
const TAB_ANIMATE = { opacity: 1, scale: 1, y: 0 };
const TAB_EXIT = { opacity: 0, scale: 0.85, y: -2 };

const METRIC_HEADLINE = {
  completion: 'Completion rate',
  responses: 'Responses / day',
  avgTime: 'Avg. time',
};

/** Shown on Y-axis tick labels (keep responses axis numeric-only to avoid clutter). */
const METRIC_Y_TICK_SUFFIX = {
  completion: '%',
  responses: '',
  avgTime: '′',
};

/** Shown in hover pills so values are unambiguous (responses are counts/day, not %). */
const METRIC_TOOLTIP_SUFFIX = {
  completion: '%',
  responses: ' /day',
  avgTime: '′',
};

const METRIC_BETTER_DIRECTION = {
  completion: 'higher',
  responses: 'higher',
  avgTime: 'lower',
};

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatMonthDay(date) {
  return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
}

const TREND_METRIC_TABS = [
  { id: 'completion', label: METRIC_HEADLINE.completion },
  { id: 'responses', label: METRIC_HEADLINE.responses },
  { id: 'avgTime', label: METRIC_HEADLINE.avgTime },
];

function suggestedMetricSwitch(currentId) {
  if (currentId === 'completion') {
    return { id: 'responses', label: METRIC_HEADLINE.responses };
  }
  if (currentId === 'responses') {
    return { id: 'completion', label: METRIC_HEADLINE.completion };
  }
  return { id: 'completion', label: METRIC_HEADLINE.completion };
}

function buildChartDataFromDailySeries(dailySeries, trendMetric) {
  if (!Array.isArray(dailySeries) || dailySeries.length === 0) return null;
  const labels = dailySeries.map((row) => {
    const d = new Date(`${row.date}T00:00:00`);
    return formatMonthDay(d);
  });
  const values = dailySeries.map((row) => {
    if (trendMetric === 'responses') return row.count ?? 0;
    if (trendMetric === 'completion') {
      return row.count > 0 ? Math.round((row.completions / row.count) * 100) : 0;
    }
    return row.avgDuration ? Math.round(row.avgDuration / 1000) : 0;
  });
  const last = values[values.length - 1];
  const suffix = trendMetric === 'completion' ? '%' : trendMetric === 'responses' ? ' /day' : 's';
  return {
    chartData: labels.map((name, i) => ({
      name,
      seriesA: values[i],
      seriesB: null,
    })),
    endLabelA: `${last}${suffix}`,
  };
}

export default function TrendComparisonChart({
  seriesATitle,
  seriesBTitle,
  trendMetric,
  onTrendMetricChange,
  selectedMetrics,
  onOpenComparePicker,
  workspaceHasCompareTarget = true,
  metricHasNoTrendData = false,
  rangeLabel = 'Last 30 days',
  compareDailySeries = null,
}) {
  const [, startMetricTransition] = useTransition();
  const apiTrend = useMemo(
    () => buildChartDataFromDailySeries(compareDailySeries, trendMetric),
    [compareDailySeries, trendMetric],
  );
  const hasLiveTrend = Boolean(apiTrend?.chartData?.length);
  const yTickSuffix = METRIC_Y_TICK_SUFFIX[trendMetric] ?? '';
  const tooltipSuffix = METRIC_TOOLTIP_SUFFIX[trendMetric] ?? '';
  const betterDirection = METRIC_BETTER_DIRECTION[trendMetric] ?? 'higher';

  const handleSelectTab = (id) => (e) => {
    e.stopPropagation();
    if (id === trendMetric) return;
    /* keep the click responsive (pill morph runs immediately) while React
       schedules the chart re-render in the background — eliminates the brief
       white-on-white flash during data swap. */
    startMetricTransition(() => onTrendMetricChange(id));
  };

  const visibleTabs = selectedMetrics
    ? TREND_METRIC_TABS.filter((tab) => selectedMetrics.includes(tab.id))
    : TREND_METRIC_TABS;

  const chartData = apiTrend?.chartData ?? [];

  const ariaSummary = seriesBTitle
    ? `Line chart comparing ${seriesATitle} and ${seriesBTitle} across five periods.`
    : `Line chart for ${seriesATitle}; connect a compare form for a second line.`;

  const showPickerEmpty = !seriesBTitle && workspaceHasCompareTarget && onOpenComparePicker;
  const suggest = suggestedMetricSwitch(trendMetric);
  const showMetricEmptyPanel =
    !showPickerEmpty && (!hasLiveTrend || metricHasNoTrendData);

  return (
    <section
      className="flex min-h-[400px] w-full shrink-0 flex-col gap-4 self-stretch rounded-[12px] border border-[#e9e7e0] bg-white p-4 shadow-sm lg:min-h-[440px]"
      aria-labelledby="trend-chart-heading"
    >
      <div className="flex w-full shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <header className="flex min-w-0 flex-col gap-0.5">
          <h2 id="trend-chart-heading" className="text-[13px] font-semibold text-black tracking-tight">
            Trend comparison over 30 days
          </h2>
          <p id="trend-chart-description" className="text-[11px] text-[#6b6966]">
            Pick a metric chip above to compare different dimensions
          </p>
        </header>

        <ul
          className="m-0 flex list-none flex-wrap items-center gap-4 p-0 text-[11px] text-[#646464]"
          aria-label="Series shown in the chart"
        >
          <li className="flex min-w-0 max-w-[220px] items-center gap-2">
            <span className="size-2 shrink-0 rounded-full bg-black" aria-hidden />
            <span className="truncate font-medium text-[#17160e]">{seriesATitle}</span>
          </li>
          {seriesBTitle ? (
            <li className="flex min-w-0 max-w-[220px] items-center gap-2">
              <span className="size-2 shrink-0 rounded-full bg-[#94a3af]" aria-hidden />
              <span className="truncate font-medium text-[#17160e]">{seriesBTitle}</span>
            </li>
          ) : (
            <li className="text-[#a8a6a0]">Add another form to plot a second series</li>
          )}
        </ul>
      </div>

      {visibleTabs.length > 0 ? (
        <LayoutGroup id="trend-metric-tabs">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="tablist"
            aria-label="Trend metric"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {visibleTabs.map((tab) => {
                const active = trendMetric === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    type="button"
                    role="tab"
                    layout
                    initial={TAB_INITIAL}
                    animate={TAB_ANIMATE}
                    exit={TAB_EXIT}
                    transition={TAB_SPRING}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleSelectTab(tab.id)}
                    aria-pressed={active}
                    aria-selected={active}
                    className={`relative h-6 cursor-pointer rounded-full border border-solid px-[11px] text-center text-[11px] whitespace-nowrap transition-[color,background-color,border-color] duration-300 ease-out ${
                      active
                        ? 'border-[#17160e] bg-[#17160e] font-medium text-white'
                        : 'border-[#e9e7e0] bg-white font-normal text-[#646464] hover:bg-[#fafaf8]'
                    }`}
                  >
                    {active ? (
                      <motion.span
                        layoutId="trend-metric-indicator"
                        className="absolute inset-0 -z-[1] rounded-full bg-[#17160e]"
                        transition={{ type: 'spring', stiffness: 440, damping: 34, mass: 0.6 }}
                      />
                    ) : null}
                    <span className="relative z-[1]">{tab.label}</span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      ) : null}

      <figure className="relative z-0 m-0 min-h-[280px] w-full flex-1 pb-2">
        <figcaption className="sr-only">{ariaSummary}</figcaption>
        {showPickerEmpty ? (
          <SelectFormToCompareEmpty onAddForm={onOpenComparePicker} className="min-h-[min(360px,50vh)] border border-[#e9e7e0]" />
        ) : showMetricEmptyPanel ? (
          <TrendMetricNoDataEmpty
            metricLabel={
              hasLiveTrend
                ? (METRIC_HEADLINE[trendMetric] ?? METRIC_HEADLINE.completion)
                : 'No responses yet'
            }
            description={
              hasLiveTrend
                ? 'Try switching to a different metric or adjusting the date range.'
                : 'Share your form to collect responses before comparing trends.'
            }
            suggestLabel={hasLiveTrend ? suggest.label : null}
            onTrySuggestedMetric={
              hasLiveTrend ? () => onTrendMetricChange(suggest.id) : undefined
            }
            className="min-h-[min(360px,50vh)]"
          />
        ) : (
          <div
            id="trend-chart-plot"
            role="img"
            aria-label={ariaSummary}
            aria-labelledby="trend-chart-heading trend-chart-description"
            className="h-full w-full overflow-x-auto overflow-y-hidden pb-px"
          >
            <TrendComparisonLinePlot
              chartData={chartData}
              yTickSuffix={yTickSuffix}
              tooltipSuffix={tooltipSuffix}
              betterDirection={betterDirection}
              seriesATitle={seriesATitle}
              seriesBTitle={seriesBTitle}
              seriesBActive={!!seriesBTitle}
            />
          </div>
        )}
      </figure>
    </section>
  );
}
