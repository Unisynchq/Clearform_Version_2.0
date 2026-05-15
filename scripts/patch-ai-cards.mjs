import fs from 'fs';

const panelPath = 'src/components/analytics/AnalyticsAiInsightsPanel.jsx';
let lines = fs.readFileSync(panelPath, 'utf8').split(/\r?\n/);

const startIdx = lines.findIndex((l) => l.startsWith('function QuickStatsSentimentBlock'));
const endIdx = lines.findIndex(
  (l, i) => i > startIdx && l.includes('Recommended Actions — Figma'),
);

if (startIdx < 0 || endIdx < 0) {
  console.error('markers not found', startIdx, endIdx);
  process.exit(1);
}

const block = `function QuickStatsSentimentBlock({ sentiment }) {
  if (sentiment.mode === 'segments') {
    return (
      <div className="flex flex-col gap-[10.287px] pb-[2.546px] pt-[2.559px]">
        <p className="text-[13.502px] font-medium leading-[20.253px] tracking-[0.27px] text-[#99968e]">
          Sentiment Distribution
        </p>
        <div className="flex h-[10.274px] w-full gap-[2.572px] overflow-hidden rounded-[5.143px]">
          <motion.div
            className="h-full rounded-l-[5.143px] bg-[#abebab]"
            style={{ width: \\\`\\\${sentiment.positive}%\\\` }}
          />
          <div className="h-full bg-[#fbdba7]" style={{ width: \\\`\\\${sentiment.neutral}%\\\` }} />
          <div
            className="h-full rounded-r-[5.143px] bg-[#ec7063]"
            style={{ width: \\\`\\\${sentiment.negative}%\\\` }}
          />
        </motion.div>
        <div className="flex justify-center pt-[2.572px]">
          {[
            { key: 'positive', color: '#1a6133', label: 'Positive' },
            { key: 'neutral', color: '#15140e', label: 'Neutral' },
            { key: 'negative', color: '#b33030', label: 'Negative' },
          ].map(({ key, color, label }) => (
            <div key={key} className="flex min-w-0 flex-1 flex-col">
              <p className="text-[19.288px] font-semibold leading-[19.288px]" style={{ color }}>
                {sentiment[key]}%
              </p>
              <p className="text-[14.145px] font-normal leading-[21.217px] text-[#99968e]">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  const accentColor = sentiment.singleColor;
  return (
    <div className="flex flex-col gap-[10px]">
      <p className="pt-0.5 text-[11px] font-normal leading-normal text-[#999]">Sentiment Distribution</p>
      <div className="flex h-[10px] w-full overflow-hidden rounded-[5px]">
        <div className="h-full w-full rounded-[5px]" style={{ backgroundColor: accentColor }} />
      </motion.div>
      <div className="flex gap-5">
        {[
          { key: 'positive', label: 'Positive' },
          { key: 'neutral', label: 'Neutral' },
          { key: 'negative', label: 'Negative' },
        ].map(({ key, label }) => {
          const isAccent = sentiment.accentLabel === key;
          return (
            <div key={key} className="flex flex-col gap-[2px]">
              <p
                className={\\\`text-[17px] font-bold leading-normal \\\${isAccent ? '' : 'text-[#ccc]'}\\\`}
                style={isAccent ? { color: accentColor } : undefined}
              >
                {sentiment[key]}%
              </p>
              <p className="text-[11px] font-normal text-[#999]">{label}</p>
            </motion.div>
          );
        })}
      </motion.div>
      {sentiment.footnote ? (
        <p className="text-[11px] font-normal leading-normal text-[#999]">{sentiment.footnote}</p>
      ) : null}
    </motion.div>
  );
}

function QuickStatsCard({ form }) {
  const sentiment = useMemo(() => quickStatsSentimentVariant(form), [form]);
  const isSegments = sentiment.mode === 'segments';

  return (
    <div className="flex flex-col gap-[20.574px] overflow-hidden rounded-[18px] border-[1.286px] border-[rgba(0,0,0,0.11)] bg-white px-[30px] py-[27px]">
      {isSegments ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-semibold leading-[25.075px] text-[#15140e]">Quick Stats</p>
            <MoreDetailsTrigger open={false} onClick={() => {}} />
          </motion.div>
          <QuickStatsSentimentBlock sentiment={sentiment} />
        </>
      ) : (
        <div className="-mx-1 flex flex-col gap-[10px] p-5">
          <p className="text-[15px] font-normal text-[#111]">Quick Stats</p>
          <QuickStatsSentimentBlock sentiment={sentiment} />
        </motion.div>
      )}

      <div className="h-[0.63px] w-full bg-[rgba(0,0,0,0.07)]" aria-hidden />

      <div className="flex flex-col gap-[10.261px] pb-[2.559px]">
        <p className="text-[13.502px] font-medium leading-[20.253px] tracking-[0.27px] text-[#99968e]">
          Top Issue Category
        </p>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex flex-col">
            <p className="text-[20px] font-semibold leading-[34.719px] text-[#15140e]">Performance</p>
            <p className="text-[14.788px] font-normal leading-[22.181px] text-[#99968e]">
              of all feedback mentions
            </p>
          </motion.div>
          <p className="shrink-0 text-[40px] font-medium leading-[41.148px] text-[#15140e]">42%</p>
        </motion.div>
      </motion.div>

      <motion.div className="h-[0.63px] w-full bg-[rgba(0,0,0,0.07)]" aria-hidden />

      <div className="flex flex-col gap-[10.261px]">
        <p className="text-[13.502px] font-medium leading-[20.253px] tracking-[0.27px] text-[#99968e]">
          7-Day Trend
        </p>
        <div className="flex h-[46.279px] w-full items-end justify-center gap-[5.143px]">
          {TREND_BARS.map((b, i) => (
            <div
              key={i}
              className="min-w-0 flex-1 rounded-t-[3.858px]"
              style={{
                height: \\\`\\\${b.height}%\\\`,
                backgroundColor: b.color,
                opacity: b.opacity,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
`;

// Fix erroneous motion.div tags in block - replace all wrong closings
const fixed = block
  .replace(/<motion\.motion\.div/g, '<div')
  .replace(/<\/motion\.div>/g, '</div>')
  .replace(/<motion\.motion\.div/g, '<div')
  .replace(/<motion\.div\n/g, '<motion.div\n') // self-closing bars stay as div
  .replace(
    /<motion\.div\n            className="h-full rounded-l/g,
    '<div\n            className="h-full rounded-l',
  )
  .replace(/<\/motion\.div>\n        <div className="flex justify-center/g, '</div>\n        <div className="flex justify-center');

lines = [...lines.slice(0, startIdx), ...fixed.split('\n'), ...lines.slice(endIdx)];

// Patch RecommendedActionsCard
const recStart = lines.findIndex((l) => l.startsWith('function RecommendedActionsCard'));
const recEnd = lines.findIndex((l, i) => i > recStart && l.startsWith('/* --------------------------------------------------------------------------') && l.includes('Main panel'));

const recBlock = `function RecommendedActionCompactCell({ action }) {
  return (
    <div className="flex min-h-[162px] flex-col bg-white p-[23px]">
      <p className="text-[12.859px] font-medium leading-[19.288px] text-[#555]">{action.index}</p>
      <p className="mt-3 text-[16px] font-medium leading-[24px] text-[#15140e]">{action.title}</p>
      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
        <div className="flex flex-wrap gap-[6.442px]">
          {action.tags.map((t) => (
            <span
              key={t.label}
              className="inline-flex items-center rounded-[25.717px] border-[1.286px] px-[11.716px] pb-[5.086px] pt-[2.913px] text-[12.859px] font-semibold leading-[19.288px]"
              style={{ backgroundColor: t.bg, borderColor: t.border, color: t.color }}
            >
              {t.label}
            </span>
          ))}
        </motion.div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="shrink-0 rounded-[10px] border border-[rgba(152,16,250,0.2)] bg-white px-3 py-2 text-[12.5px] font-semibold text-[#15140e] cursor-pointer whitespace-nowrap"
        >
          Take action →
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function RecommendedActionsCard() {
  const [expanded, setExpanded] = useState(false);

  if (expanded) {
    return (
      <div className="rounded-[16px] border border-[#e8e8e3] bg-white p-px shadow-[0px_24px_80px_rgba(0,0,0,0.18),0px_8px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-start justify-between border-b border-[#efefeb] px-[28px] pb-[20.714px] pt-6">
          <div className="min-w-0 pr-4">
            <p className="text-[18px] font-semibold leading-[21.6px] tracking-[-0.36px] text-[#1a1a18]">
              Recommended Actions
            </p>
            <p className="mt-1 text-[13px] font-normal leading-normal text-[#9b9b95]">
              AI-prioritised based on impact & effort · {RECOMMENDED_ACTIONS_EXPANDED.length} actions total
            </p>
          </motion.div>
          <MoreDetailsTrigger open={expanded} onClick={() => setExpanded(false)} />
        </motion.div>
        <div>
          <motion.div className="border-b border-[#efefeb]">
            <div className="grid grid-cols-2 divide-x divide-y divide-[#efefeb] sm:grid-cols-4">
              {[
                { n: '3', l: 'High Impact' },
                { n: '2', l: 'Quick Wins' },
                { n: '1', l: 'Long-term' },
                { n: '312+', l: 'Users impacted', accent: '#2d7a5a' },
              ].map((c) => (
                <div key={c.l} className="flex flex-col gap-1 py-4 pl-5 pr-5 sm:pr-[20.714px]">
                  <p
                    className="text-[26px] font-bold leading-[26px] tracking-[-1.04px]"
                    style={{ color: c.accent ?? '#1a1a18' }}
                  >
                    {c.n}
                  </p>
                  <p className="text-[11.5px] font-normal text-[#9b9b95]">{c.l}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          {RECOMMENDED_ACTIONS_EXPANDED.map((a, idx) => (
            <div
              key={a.index}
              className={\\\`@container grid grid-cols-1 gap-4 border-b border-[#efefeb] px-5 py-5 @md:grid-cols-[28px_1fr_minmax(120px,140px)] @md:gap-x-4 @md:px-7 \\\${
                idx === RECOMMENDED_ACTIONS_EXPANDED.length - 1 ? 'border-b-0' : ''
              }\\\`}
            >
              <div className="hidden text-[11px] font-semibold tracking-[0.44px] text-[#9b9b95] @md:block">
                {a.index}
              </motion.div>
              <div className="flex min-w-0 flex-col gap-[5px]">
                <span className="text-[11px] font-semibold tracking-[0.44px] text-[#9b9b95] @md:hidden">
                  {a.index}
                </span>
                <p className="break-words text-[14px] font-semibold leading-[18.9px] text-[#1a1a18]">
                  {a.title}
                </p>
                <div className="text-[13px] font-normal leading-[20.15px] text-[#6b6b65]">
                  {a.body.map((line, li) => (
                    <p key={li} className="mb-0">
                      {line}
                    </p>
                  ))}
                </motion.div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {a.tags.map((t) => (
                    <span
                      key={t.label}
                      className="inline-flex items-center rounded-[20px] px-[9px] py-[3px] text-[11.5px] font-medium"
                      style={{ backgroundColor: t.bg, color: t.color }}
                    >
                      {t.label}
                    </span>
                  ))}
                </motion.div>
                <div className="flex flex-wrap gap-4 pt-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10.5px] font-medium uppercase tracking-[0.735px] text-[#9b9b95]">
                      Est. impact
                    </span>
                    <span className="text-[12.5px] font-semibold text-[#1a1a18]">{a.estImpact}</span>
                  </motion.div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10.5px] font-medium uppercase tracking-[0.735px] text-[#9b9b95]">
                      Users affected
                    </span>
                    <span className="text-[12.5px] font-semibold text-[#1a1a18]">{a.usersAffected}</span>
                  </motion.div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10.5px] font-medium uppercase tracking-[0.735px] text-[#9b9b95]">
                      Confidence
                    </span>
                    <span className="text-[12.5px] font-semibold text-[#1a1a18]">{a.confidence}</span>
                  </motion.div>
                </motion.div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-[#9b9b95]">Effort</span>
                  <EffortDots filled={a.effortFilled} total={5} />
                  <span className="pl-0.5 text-[11px] text-[#9b9b95]">{a.effortLabel}</span>
                </motion.div>
              </motion.div>
              <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 @md:flex-col @md:items-end @md:gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[8px] bg-[#1a1a18] px-4 py-2 text-[12.5px] font-medium text-white"
                >
                  Take action
                  <RiArrowRightSLine size={12} aria-hidden />
                </motion.button>
                <p className="text-[11px] font-normal text-[#9b9b95]">{a.ctaHint}</p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-[20.574px] overflow-hidden rounded-[18px] border-[1.286px] border-[rgba(0,0,0,0.11)] bg-white px-[30px] py-[27px]">
      <div className="flex items-center justify-between">
        <p className="text-[16px] font-semibold leading-[25.075px] text-[#15140e]">Recommended Actions</p>
        <MoreDetailsTrigger open={expanded} onClick={() => setExpanded(true)} />
      </motion.div>
      <div className="overflow-hidden rounded-[12.859px] bg-[rgba(0,0,0,0.07)] p-px">
        <div className="grid grid-cols-1 gap-px md:grid-cols-3">
          {RECOMMENDED_ACTIONS_COMPACT.map((action) => (
            <RecommendedActionCompactCell key={action.index} action={action} />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
`;

const recFixed = recBlock.replace(/<\/motion\.motion\.div>/g, '</div>').replace(/<\/motion\.motion\.motion\.motion\.div>/g, '</div>');

// Actually just replace all erroneous </motion.div> that should be </div> - keep motion.button
let recFixed2 = recBlock;
// Replace closing motion.div with div except we need to be careful
recFixed2 = recFixed2.replace(/<\/motion\.div>/g, '</motion.div>');
// That's wrong - let me build rec block manually in a separate file without typos

console.log('use manual fix');
process.exit(1);
