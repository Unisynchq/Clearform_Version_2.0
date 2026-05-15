import fs from 'fs';

const p = 'src/components/analytics/AnalyticsAiInsightsPanel.jsx';
let s = fs.readFileSync(p, 'utf8');

if (!s.includes('aiInsights/QuickStatsCard')) {
  s = s.replace(
    "} from 'react-icons/ri';",
    "} from 'react-icons/ri';\nimport QuickStatsCard from './aiInsights/QuickStatsCard';\nimport RecommendedActionsCard from './aiInsights/RecommendedActionsCard';\nimport MoreDetailsTrigger from './aiInsights/MoreDetailsTrigger';",
  );
}

const compactStart = s.indexOf('/** Figma 2241:18431');
if (compactStart > 0) {
  const compactEnd = s.indexOf('function hashFormId', compactStart);
  if (compactEnd > compactStart) {
    s = s.slice(0, compactStart) + s.slice(compactEnd);
  }
}

const qs = s.indexOf('/*  Quick Stats');
const recEnd = s.indexOf('/* --------------------------------------------------------------------------\n/*  Main panel');
if (qs > 0 && recEnd > qs) {
  s = s.slice(0, qs) + s.slice(recEnd);
}

const mdStart = s.indexOf('function MoreDetailsTrigger');
const mdEnd = s.indexOf('/* --------------------------------------------------------------------------\n/*  Figma 2241:19367');
if (mdStart > 0 && mdEnd > mdStart) {
  s = s.slice(0, mdStart) + s.slice(mdEnd);
}

// Remove TREND_BARS and quickStatsSentimentVariant if unused
const trendStart = s.indexOf('const TREND_BARS');
const trendEnd = s.indexOf('/** Figma 2241:19649');
if (trendStart > 0 && trendEnd > trendStart) {
  // keep RECOMMENDED_ACTIONS_EXPANDED for now - check if still in file
}

const recExpStart = s.indexOf('/** Figma 2241:19649');
const recExpEnd = s.indexOf('function hashFormId', recExpStart);
if (recExpStart > 0 && recExpEnd > recExpStart) {
  s = s.slice(0, recExpStart) + s.slice(recExpEnd);
}

const hashStart = s.indexOf('function hashFormId');
const hashEnd = s.indexOf('/** Figma 2241:19429');
if (hashStart > 0 && hashEnd > hashStart) {
  s = s.slice(0, hashStart) + s.slice(hashEnd);
}

const sentStart = s.indexOf('/** Figma 2241:19429');
const sentEnd = s.indexOf('function MoreDetailsTrigger');
if (sentStart > 0 && sentEnd > sentStart) {
  s = s.slice(0, sentStart) + s.slice(sentEnd);
}

// Remove orphaned quickStats comment block
const sent2 = s.indexOf('/** Figma 2241:19429');
if (sent2 > 0) {
  const end2 = s.indexOf('function TopPatternsErrorCard', sent2);
  if (end2 > sent2) s = s.slice(0, sent2) + s.slice(end2);
}

fs.writeFileSync(p, s);
console.log('done');
