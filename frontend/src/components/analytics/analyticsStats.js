/**
 * Derive per-form analytics numbers. Real backends will replace this with API data,
 * but the proportions here mirror the Figma reference (1840→632→453→248).
 */
export function deriveFormStats(form) {
  const submitted = form?.responses ?? 0;
  const target = form?.responseLimit ?? Math.max(500, submitted * 2 || 500);
  const toTarget = Math.max(0, target - submitted);

  const reached = Math.round(submitted * 7.4194);
  const opened = Math.round(submitted * 2.5484);
  const started = Math.round(submitted * 1.8266);

  const reachOpenedDrop = reached > 0 ? Math.round((1 - opened / reached) * 100) : 0;
  const openedStartedDrop = opened > 0 ? Math.round((1 - started / opened) * 100) : 0;
  const startedSubmittedDrop = started > 0 ? Math.round((1 - submitted / started) * 100) : 0;
  const startedSubmittedSuccess = started > 0
    ? Math.round((submitted / started) * 100)
    : 0;

  const drops = [
    { label: 'reach → opened', pct: reachOpenedDrop, stepLabel: 'at opened step' },
    { label: 'opened → started', pct: openedStartedDrop, stepLabel: 'at started step' },
    { label: 'started → submit', pct: startedSubmittedDrop, stepLabel: 'at submit step' },
  ];
  const biggest = drops.reduce((a, b) => (b.pct > a.pct ? b : a), drops[0]);

  const conversionRaw = reached > 0 ? (submitted / reached) * 100 : 0;
  const conversion = Number.isFinite(conversionRaw) ? conversionRaw.toFixed(1) : '0.0';

  const seed = ((form?.id ?? 1) * 2654435761) >>> 0;
  const slice = (offset) => ((seed >>> offset) & 0xff) / 255;
  const avgTimeSec = Math.round(110 + slice(3) * 110);
  const m = Math.floor(avgTimeSec / 60);
  const s = avgTimeSec % 60;
  const avgTimeLabel = m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
  const trendPct = Math.round(8 + slice(11) * 22);
  const trendUp = (seed & 1) === 1;

  return buildFunnelStats({
    submitted,
    target,
    reached,
    opened,
    started,
    avgTimeSec,
    trendPct,
    trendUp,
    seed,
  });
}

function emptyFormStats(form) {
  const target = form?.responseLimit ?? 500;
  return buildFunnelStats({
    submitted: 0,
    target,
    reached: 0,
    opened: 0,
    started: 0,
    avgTimeSec: 0,
    trendPct: 0,
    trendUp: true,
    seed: 0,
  });
}

/** Build funnel display stats from API performance payload when available. */
export function deriveFormStatsFromApi(form, apiStats) {
  if (!apiStats || apiStats.source === 'client-demo') {
    return emptyFormStats(form);
  }
  const funnel = apiStats.funnel ?? {};
  const totalResponses = apiStats.responses ?? funnel.submitted ?? 0;
  const submitted = totalResponses;
  if (totalResponses === 0 && (funnel.reached ?? 0) === 0) {
    return emptyFormStats(form);
  }
  const reached = funnel.reached ?? Math.max(submitted, 0);
  const opened = funnel.opened ?? Math.max(submitted, 0);
  const started = funnel.started ?? Math.max(submitted, 0);
  const target = form?.responseLimit ?? Math.max(submitted, submitted * 2 || 500);

  let avgTimeSec = null;
  if (typeof apiStats.avgTimePerQuestionSec === 'number' && apiStats.avgTimePerQuestionSec > 0) {
    avgTimeSec = Math.round(apiStats.avgTimePerQuestionSec);
  }

  return buildFunnelStats({
    submitted,
    target,
    reached,
    opened,
    started,
    avgTimeSec,
    trendPct: typeof apiStats.trendPct === 'number' ? apiStats.trendPct : 0,
    trendUp: apiStats.trendUp !== false,
    seed: 0,
  });
}

function buildFunnelStats({
  submitted,
  target,
  reached,
  opened,
  started,
  avgTimeSec,
  trendPct,
  trendUp,
  seed,
}) {
  const toTarget = Math.max(0, target - submitted);

  const reachOpenedDrop = reached > 0 ? Math.round((1 - opened / reached) * 100) : 0;
  const openedStartedDrop = opened > 0 ? Math.round((1 - started / opened) * 100) : 0;
  const startedSubmittedDrop = started > 0 ? Math.round((1 - submitted / started) * 100) : 0;
  const startedSubmittedSuccess = started > 0
    ? Math.round((submitted / started) * 100)
    : 0;

  const drops = [
    { label: 'reach → opened', pct: reachOpenedDrop, stepLabel: 'at opened step' },
    { label: 'opened → started', pct: openedStartedDrop, stepLabel: 'at started step' },
    { label: 'started → submit', pct: startedSubmittedDrop, stepLabel: 'at submit step' },
  ];
  const biggest = drops.reduce((a, b) => (b.pct > a.pct ? b : a), drops[0]);

  const conversionRaw = reached > 0 ? (submitted / reached) * 100 : 0;
  const conversion = Number.isFinite(conversionRaw) ? conversionRaw.toFixed(1) : '0.0';

  const avgTimeLabel =
    avgTimeSec == null
      ? '—'
      : (() => {
          const m = Math.floor(avgTimeSec / 60);
          const s = avgTimeSec % 60;
          return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
        })();

  return {
    submitted,
    target,
    toTarget,
    reached,
    opened,
    started,
    biggest,
    conversion,
    conversionPct: Math.round(conversionRaw),
    drops,
    avgTimeSec,
    avgTimeLabel,
    trendPct,
    trendUp,
    startedSubmittedSuccess,
  };
}
