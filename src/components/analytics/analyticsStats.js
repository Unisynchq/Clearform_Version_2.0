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
