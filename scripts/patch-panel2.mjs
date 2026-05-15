import fs from 'fs';

const p = 'src/components/analytics/AnalyticsAiInsightsPanel.jsx';
let lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);

// Find line indices (0-based)
const quickStatsComment = lines.findIndex((l) => l.includes('/*  Quick Stats — Figma 2241:19576'));
const mainPanelComment = lines.findIndex((l) => l.includes('/*  Main panel — composes states'));

if (quickStatsComment >= 0 && mainPanelComment > quickStatsComment) {
  lines = [...lines.slice(0, quickStatsComment), ...lines.slice(mainPanelComment)];
}

// Remove duplicate MoreDetailsTrigger function
const mdFn = lines.findIndex((l) => l.startsWith('function MoreDetailsTrigger'));
const patternsFailed = lines.findIndex((l) => l.includes('Figma 2241:19367'));
if (mdFn >= 0 && patternsFailed > mdFn) {
  lines = [...lines.slice(0, mdFn), ...lines.slice(patternsFailed)];
}

// Remove TREND_BARS constant
const trendStart = lines.findIndex((l) => l.startsWith('const TREND_BARS'));
const trendEnd = lines.findIndex((l, i) => i > trendStart && l.startsWith('function '));
if (trendStart >= 0 && trendEnd > trendStart) {
  lines = [...lines.slice(0, trendStart), ...lines.slice(trendEnd)];
}

// Remove EffortDots if present and unused
const effortStart = lines.findIndex((l) => l.startsWith('function EffortDots'));
const effortEnd = lines.findIndex((l, i) => i > effortStart && l.startsWith('/* '));
if (effortStart >= 0 && effortEnd > effortStart) {
  lines = [...lines.slice(0, effortStart), ...lines.slice(effortEnd)];
}

// Remove RECOMMENDED_ACTIONS_EXPANDED block if still there
let s = lines.join('\n');
const recExp = s.indexOf('const RECOMMENDED_ACTIONS_EXPANDED');
if (recExp >= 0) {
  const end = s.indexOf('\n\nfunction hashFormId', recExp);
  if (end < 0) {
    const end2 = s.indexOf('\n\nconst TOP_PATTERNS', recExp);
    if (end2 > recExp) s = s.slice(0, recExp) + s.slice(end2);
  }
}

fs.writeFileSync(p, s);
console.log('panel2 done');
