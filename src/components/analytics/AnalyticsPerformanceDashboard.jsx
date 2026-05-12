import { useMemo, useState } from 'react';
import {
  RiArrowUpLine,
  RiErrorWarningLine,
} from 'react-icons/ri';

const CHART_MAX = 20;

const DAILY_BARS = [
  { label: 'Apr 1', value: 9, tier: 'ok' },
  { label: 'Apr 3', value: 7, tier: 'ok' },
  { label: 'Apr 5', value: 6, tier: 'warn' },
  { label: 'Apr 7', value: 11, tier: 'ok' },
  { label: 'Apr 9', value: 10, tier: 'ok' },
  { label: 'Apr 11', value: 8, tier: 'ok' },
  { label: 'Apr 12', value: 8, tier: 'warn' },
  { label: 'Apr 13', value: 12, tier: 'ok' },
  { label: 'Apr 14', value: 2, tier: 'bad', highlight: true },
  { label: 'Apr 15', value: 9, tier: 'ok' },
  { label: 'Apr 17', value: 10, tier: 'ok' },
  { label: 'Apr 19', value: 14, tier: 'ok' },
  { label: 'Apr 21', value: 11, tier: 'ok' },
  { label: 'Apr 23', value: 10, tier: 'ok' },
  { label: 'Apr 25', value: 9, tier: 'ok' },
];

const TREND_SEGMENTS = [
  { kind: 'good', w: 0.14 },
  { kind: 'mid', w: 0.08 },
  { kind: 'bad', w: 0.06 },
  { kind: 'bad', w: 0.09 },
  { kind: 'mid', w: 0.07 },
  { kind: 'good', w: 0.11 },
  { kind: 'bad', w: 0.05 },
  { kind: 'mid', w: 0.06 },
  { kind: 'good', w: 0.08 },
  { kind: 'mid', w: 0.06 },
  { kind: 'good', w: 0.07 },
  { kind: 'bad', w: 0.04 },
  { kind: 'mid', w: 0.05 },
  { kind: 'good', w: 0.07 },
];

const RIVER_QUESTIONS = [
  { q: 'Q1', band: 'healthy', drop: null },
  { q: 'Q2', band: 'attention', drop: '-22%' },
  { q: 'Q3', band: 'critical', drop: '-34%', alert: true },
  { q: 'Q4', band: 'attention', drop: '-18%' },
  { q: 'Q5', band: 'healthy', drop: '-6%' },
  { q: 'Q6', band: 'healthy', drop: '-5%' },
  { q: 'Q7', band: 'attention', drop: '-27%', alert: true },
  { q: 'Q8', band: 'healthy', drop: '-8%' },
  { q: 'Q9', band: 'attention', drop: '-15%' },
  { q: 'Q10', band: 'healthy', drop: '-4%' },
  { q: 'Q11', band: 'healthy', drop: '-3%' },
  { q: 'Q12', band: 'attention', drop: '-21%' },
  { q: 'Q13', band: 'healthy', drop: '-7%' },
  { q: 'Q14', band: 'critical', drop: '-41%', alert: true },
  { q: 'Q15', band: 'attention', drop: '-12%' },
  { q: 'Q16', band: 'healthy', drop: '-5%' },
  { q: 'Q17', band: 'healthy', drop: '-4%' },
  { q: 'Q18', band: 'attention', drop: '-19%' },
  { q: 'Q19', band: 'healthy', drop: '-9%' },
  { q: 'Q20', band: 'healthy', drop: '-6%' },
  { q: 'Q21', band: 'attention', drop: '-11%' },
  { q: 'Q22', band: 'healthy', drop: '-2%' },
];

function barColor(tier) {
  if (tier === 'bad') return 'bg-[rgba(231,76,60,0.85)]';
  if (tier === 'warn') return 'bg-[rgba(245,166,35,0.65)]';
  return 'bg-[rgba(46,204,46,0.45)]';
}

export function AnalyticsStatsRow() {
  return (
    <section className="bg-white rounded-[10px] px-4 py-4 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0">
      <div className="flex flex-col gap-[5px] md:pr-6">
        <p className="text-[12px] font-medium text-[#646464] tracking-[0.22px]">Total responses</p>
        <p className="text-[34px] font-medium text-black tracking-[-1.36px] leading-[34px]">248</p>
        <div className="flex flex-wrap items-center gap-1 text-[11.5px]">
          <span className="text-[#2d6b12]">↑ 12%</span>
          <span className="text-[#646464]">· 252 to target</span>
        </div>
      </div>
      <div className="md:border-l-2 md:border-[#e9e7e0] md:pl-6 flex flex-col gap-[5px]">
        <div className="flex flex-wrap items-center gap-2 min-h-[14px]">
          <span className="text-[12px] font-medium text-[#646464] tracking-[0.22px]">Completion rate</span>
          <span className="bg-[#fef2df] text-[#a55c08] text-[10px] font-semibold tracking-[0.22px] px-[7px] py-[2px] rounded-full">
            −22% vs industry
          </span>
        </div>
        <p className="text-[34px] font-medium text-[#fb1a00] tracking-[-1.36px] leading-[34px]">13.5%</p>
        <div className="flex flex-wrap items-center gap-1 text-[11.5px] text-[#646464]">
          <span>Industry avg.</span>
          <span className="font-bold text-[#17160e]">35%</span>
        </div>
      </div>
      <div className="md:border-l-2 md:border-[#e9e7e0] md:pl-6 flex flex-col gap-[5px]">
        <p className="text-[12px] font-medium text-[#646464] tracking-[0.22px]">Avg. time</p>
        <p className="text-[34px] font-medium text-[#17160e] tracking-[-1.36px] leading-[34px]">2m 14s</p>
        <div className="flex flex-wrap items-center gap-1 text-[11.5px] text-[#646464]">
          <span>~ on target</span>
          <span>· 1% faster</span>
        </div>
      </div>
    </section>
  );
}

export function AnalyticsFunnelCard() {
  return (
    <div className="bg-white rounded-[10px] px-4 sm:px-8 py-6 flex flex-col items-center gap-4 border border-[#eceae4]/80">
      <div className="text-[12px] font-semibold text-[#1a1a1c] bg-[#f7f6f2] border border-[#d8d6d0] rounded-[10px] px-3 py-2 w-full max-w-[434px] text-center">
        Target Responses — 500
      </div>
      <div className="relative w-full max-w-[460px] flex flex-col items-center gap-0">
        <svg viewBox="0 0 420 280" className="w-full max-h-[280px]" aria-hidden>
          <defs>
            <linearGradient id="f1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ebe9e4" />
              <stop offset="100%" stopColor="#dcd9d2" />
            </linearGradient>
            <linearGradient id="f2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e5e2dc" />
              <stop offset="100%" stopColor="#d4d1ca" />
            </linearGradient>
            <linearGradient id="f3" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f3dede" />
              <stop offset="100%" stopColor="#e8c8c8" />
            </linearGradient>
            <linearGradient id="f4" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#c8f0dd" />
              <stop offset="100%" stopColor="#9fe0c3" />
            </linearGradient>
          </defs>
          <polygon points="10,8 410,8 360,52 60,52" fill="url(#f1)" stroke="#cfcbc4" strokeWidth="0.5" />
          <polygon points="60,58 360,58 310,108 110,108" fill="url(#f2)" stroke="#c9c5bd" strokeWidth="0.5" />
          <polygon points="110,114 310,114 268,178 152,178" fill="url(#f3)" stroke="#e0a8a8" strokeWidth="0.5" />
          <polygon points="152,184 268,184 230,262 190,262" fill="url(#f4)" stroke="#7cecbc" strokeWidth="0.6" />
          <line x1="310" y1="146" x2="368" y2="146" stroke="#ff8181" strokeWidth="1" strokeDasharray="3 2" opacity="0.9" />
          <line x1="268" y1="220" x2="330" y2="220" stroke="#2d8a65" strokeWidth="1" strokeDasharray="3 2" opacity="0.85" />
        </svg>
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 text-[12px] font-medium text-black whitespace-nowrap">
          1840 Users reached
        </div>
        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 text-[12px] font-medium">
          <span className="text-black">632</span>
          <span className="text-[#6f6f6f]"> Opened</span>
        </div>
        <div className="absolute top-[54%] left-[42%] text-[12px] font-medium">
          <span className="text-[#c05050]">453</span>
          <span className="text-[#676767]"> Started</span>
        </div>
        <div className="absolute top-[52%] right-[4%] bg-[#f5e8e8] border border-[#ff8181] rounded-[10px] px-2 py-1 text-[12px] font-medium text-[#c05050]">
          28% Drop off
        </div>
        <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2 text-[12px] font-medium text-[#2d8a65]">
          248
        </div>
        <div className="absolute bottom-[10%] right-[8%] bg-[#d4f0e4] border border-[#7cecbc] rounded-[10px] px-2 py-1 text-[12px] font-medium text-[#2d8a65]">
          54% Submissions
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 w-full max-w-[520px] pt-2">
        <div className="bg-[#f7f6f2] rounded-[10px] px-3 py-3 flex flex-col gap-[3px]">
          <span className="text-[10px] font-medium text-[#5e5e5e] tracking-[0.7px] uppercase">Conversion</span>
          <span className="text-[16px] font-semibold text-[#3aad85] tabular-nums">13.5%</span>
          <span className="text-[10px] font-medium text-[#2d8a65]">reach → submit</span>
        </div>
        <div className="bg-[#f7f6f2] rounded-[10px] px-3 py-3 flex flex-col gap-[3px]">
          <span className="text-[10px] font-medium text-[#5e5e5e] tracking-[0.7px] uppercase">Biggest drop</span>
          <span className="text-[16px] font-semibold text-[#d95f5f] tabular-nums">28%</span>
          <span className="text-[10px] font-medium text-[#a03030]">at started step</span>
        </div>
        <div className="bg-[#f7f6f2] rounded-[10px] px-3 py-3 flex flex-col gap-[3px]">
          <span className="text-[10px] font-medium text-[#5e5e5e] tracking-[0.7px] uppercase">To target</span>
          <span className="text-[16px] font-semibold text-[#e8a838] tabular-nums">252</span>
          <span className="text-[10px] font-medium text-[#9a6a10]">responses left</span>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsDailyResponsesCard() {
  const [seg, setSeg] = useState('responses');
  const tabs = [
    { id: 'responses', label: 'Responses / day' },
    { id: 'completion', label: 'Completion rate' },
    { id: 'time', label: 'Time per question' },
  ];

  return (
    <div className="bg-white rounded-[20px] border border-[#ebebeb] overflow-hidden flex flex-col min-h-[420px]">
      <div className="flex flex-wrap gap-1 px-3 pt-3 border-b border-[#ebebeb]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSeg(t.id)}
            className={`rounded-t-[8px] px-[14px] py-[7px] text-[12.5px] transition-colors cursor-pointer ${
              seg === t.id
                ? 'bg-[#111] text-white font-semibold'
                : 'text-[#7c7c7c] font-medium hover:bg-[#f4f3ef]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="px-5 pt-4 pb-2 flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-1 text-[#111]">
            <span className="text-[46px] font-black tracking-[-3px] leading-none tabular-nums">8.3</span>
            <span className="text-[19px] font-semibold tracking-[-0.5px]">/day</span>
          </div>
          <p className="text-[12px] text-[#7c7c7c]">Avg. responses per day</p>
          <div className="inline-flex items-center gap-2 bg-[#eafaf1] rounded-[20px] px-[10px] py-[5px] w-fit">
            <RiArrowUpLine className="text-[rgba(26,158,78,0.85)]" size={14} />
            <span className="text-[12px] font-semibold text-[rgba(26,158,78,0.85)]">
              Trending up · last 30 days
            </span>
          </div>
        </div>
        <div className="bg-[#fff5f5] border border-[#ffd6d6] rounded-[10px] px-[15px] py-[9px] flex items-start gap-2">
          <RiErrorWarningLine className="text-[rgba(192,57,43,0.65)] shrink-0 mt-0.5" size={14} />
          <p className="text-[13px] font-bold text-[rgba(192,57,43,0.65)] leading-snug">
            Apr 14 had the lowest responses — only 2 on that day
          </p>
        </div>
        <div className="flex flex-col gap-2 flex-1 min-h-[200px]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10.5px] font-bold text-[#6d6d6d] tracking-[0.63px] uppercase">
              Responses per day
            </span>
            <div className="flex flex-wrap gap-3 text-[10.5px] text-[#7c7c7c] font-medium">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-[7px] rounded-[3.5px] bg-[rgba(46,204,46,0.4)]" /> On track
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-[7px] rounded-[3.5px] bg-[rgba(245,166,35,0.4)]" /> A bit low
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-[7px] rounded-[3.5px] bg-[rgba(231,76,60,0.8)]" /> Much lower
              </span>
            </div>
          </div>
          <div className="flex gap-1 items-end flex-1 pt-2 pb-6 border-b border-[#eceae4] relative">
            <div className="flex flex-col justify-between text-[7px] text-[#6a6a6a] pr-1 h-[160px] py-0.5 tabular-nums">
              <span>20</span>
              <span>15</span>
              <span>10</span>
              <span>5</span>
              <span>0</span>
            </div>
            <div className="flex-1 flex items-end justify-between gap-[3px] h-[160px] relative">
              {DAILY_BARS.map((d) => {
                const hPct = (d.value / CHART_MAX) * 100;
                return (
                  <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="relative w-full flex justify-center items-end h-[140px]">
                      <div
                        className={`w-[72%] max-w-[28px] rounded-t-[4px] transition-transform ${barColor(d.tier)} ${
                          d.highlight ? 'ring-2 ring-[rgba(231,76,60,0.5)]' : ''
                        }`}
                        style={{ height: `${hPct}%`, minHeight: d.value > 0 ? 4 : 0 }}
                      />
                      {d.highlight && (
                        <span className="absolute -top-5 text-[8px] font-bold text-[rgba(231,76,60,0.85)] tabular-nums">
                          {d.value}
                        </span>
                      )}
                    </div>
                    <span className="text-[7px] text-[#6d6d6d] truncate w-full text-center">{d.label}</span>
                  </div>
                );
              })}
              <div className="pointer-events-none absolute left-[8%] right-[8%] top-[25%] border-t border-dashed border-[#d8d6d0]" />
              <span className="pointer-events-none absolute right-2 top-[18%] text-[7px] text-[#6d6d6d]">
                typical: 8
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildRiverPath(width, height, segments) {
  const pad = 16;
  const usable = width - pad * 2;
  let x = pad;
  const topPts = [{ x, y: pad + 8 }];
  const botPts = [{ x, y: height - pad - 8 }];
  segments.forEach((seg, i) => {
    const w = usable * seg.w;
    const flow = 1 - i * 0.028;
    const midY = height / 2 + Math.sin(i * 1.1) * 12 * (1 - flow * 0.5);
    const half = (height * 0.22 * flow) / 2;
    x += w;
    topPts.push({ x, y: midY - half });
    botPts.push({ x, y: midY + half });
  });
  topPts.push({ x: width - pad, y: pad + 28 });
  botPts.push({ x: width - pad, y: height - pad - 28 });
  const topLine = topPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const botRev = [...botPts].reverse().map((p, i) => `${i === 0 ? 'L' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return `${topLine} ${botRev} Z`;
}

export function AnalyticsDropoffRiverCard() {
  const [filterPill, setFilterPill] = useState('all');
  const pills = ['All', 'Critical', 'Watch', 'Healthy'];
  const [hoverQ, setHoverQ] = useState(null);

  const pathD = useMemo(() => buildRiverPath(920, 132, TREND_SEGMENTS), []);

  return (
    <section className="bg-[#fafaf8] border border-[#e8e8e5] rounded-[10px] p-[17px] flex flex-col gap-4 shadow-[0_2px_2px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-[10px] font-semibold text-[#888780] tracking-[0.7px] uppercase">
          Question drop-off river
        </h3>
      </div>
      <div className="flex flex-wrap gap-[5px] items-center">
        {pills.map((p) => {
          const id = p.toLowerCase();
          const active = filterPill === id;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setFilterPill(id)}
              className={`rounded-[20px] px-[13px] py-[5px] text-[11px] border transition-colors cursor-pointer ${
                active
                  ? 'bg-[#1a1a18] border-[#1a1a18] text-white'
                  : 'bg-white border-[#d3d1c7] text-[#5f5e5a] hover:bg-[#f4f3ef]'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 text-[11px] text-[#5f5e5a]">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-[#e24b4a]" /> Critical (70–100%)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-[#ef9f27]" /> Attention (40–70%)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-[#3aad85]" /> Healthy (0–15%)
        </span>
      </div>
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox="0 0 920 132"
          className="w-[920px] max-w-none h-[120px] mx-auto block"
          role="img"
          aria-label="Question drop-off flow"
        >
          <defs>
            <linearGradient id="rvBand" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8fd4b4" />
              <stop offset="35%" stopColor="#f5cf93" />
              <stop offset="55%" stopColor="#f29896" />
              <stop offset="72%" stopColor="#f5cf93" />
              <stop offset="100%" stopColor="#8fd4b4" />
            </linearGradient>
          </defs>
          <path
            d={pathD}
            fill="url(#rvBand)"
            opacity={0.92}
            stroke="#e0ddd6"
            strokeWidth={0.6}
          />
        </svg>
        <div className="relative flex justify-between text-[7px] sm:text-[8px] text-[#6d6d6d] px-2 min-w-[720px] -mt-1">
          {RIVER_QUESTIONS.map((item, i) => (
            <button
              key={item.q}
              type="button"
              className={`flex flex-col items-center gap-0.5 min-w-[28px] cursor-pointer rounded px-0.5 hover:text-[#1a1a1c] transition-colors ${
                hoverQ === i + 1 ? 'text-[#1a1a1c] bg-[#f4f3ef]' : ''
              }`}
              onMouseEnter={() => setHoverQ(i + 1)}
              onMouseLeave={() => setHoverQ(null)}
              onFocus={() => setHoverQ(i + 1)}
              onBlur={() => setHoverQ(null)}
            >
              <span className="relative inline-flex items-center justify-center">
                {item.alert && (
                  <RiErrorWarningLine className="absolute -top-3 text-[#e24b4a]" size={10} />
                )}
                <span className="font-semibold">{item.q}</span>
              </span>
              {item.drop && <span className="text-[#a8a6a0] whitespace-nowrap">{item.drop}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-[10px] border border-[#e5e3dc] bg-white p-4 max-w-[320px] shadow-sm">
        <p className="text-[10px] font-semibold text-[#888780] tracking-[0.5px] uppercase mb-1">
          Hover state — Q10 · Text
        </p>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[13px] font-semibold text-[#1a1a1c]">Your name</span>
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#eafaf1] text-[#2d8a65]">
            Healthy
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-[12px] text-[#646464]">
          <span>
            <strong className="text-[#1a1a1c]">1,712</strong> Reached
          </span>
          <span className="text-[#2d8a65] font-medium">−4% Dropped</span>
          <span>
            <strong className="text-[#1a1a1c]">8s</strong> Avg time
          </span>
        </div>
        <p className="mt-3 text-[11px] text-[#7c7c7c] bg-[#f7f6f2] rounded-[8px] px-3 py-2 border border-[#eceae4]">
          Fastest completion in the flow.
        </p>
      </div>
    </section>
  );
}
