import { useState } from 'react';
import {
  RiCloseLine,
  RiAddLine,
  RiDownloadLine,
  RiFilter3Line,
  RiBarChartBoxLine,
  RiTableLine,
} from 'react-icons/ri';

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

function AnalyticsComparePanel({ currentForm }) {
  const [view, setView] = useState('chart');
  const titleA = currentForm?.title ?? 'Current form';

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
      <div>
        <p className="text-[10px] font-semibold text-[#888780] tracking-[0.65px] uppercase mb-3">
          Select forms or folders to compare
        </p>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[160px] max-w-[220px] rounded-[10px] border border-[#e5e3dc] bg-white p-4 shadow-sm">
            <span className="text-[10px] font-semibold text-[#a8a6a0] uppercase tracking-wide">Current</span>
            <p className="text-[14px] font-semibold text-[#1a1a1c] mt-1 truncate">{titleA}</p>
            <p className="text-[12px] text-[#6b6966] mt-2">
              <span className="text-[#2e7d52]">●</span> Live · 248 responses
            </p>
          </div>
          <div className="flex-1 min-w-[160px] max-w-[220px] rounded-[10px] border border-[#e5e3dc] bg-white p-4 shadow-sm relative">
            <button type="button" className="absolute top-3 right-3 text-[#a8a6a0] hover:text-[#393939] cursor-pointer" aria-label="Remove">
              <RiCloseLine size={16} />
            </button>
            <span className="text-[10px] font-semibold text-[#a8a6a0] uppercase tracking-wide">Compare A</span>
            <p className="text-[14px] font-semibold text-[#1a1a1c] mt-1">NPS Survey Q4 2025</p>
            <p className="text-[12px] text-[#6b6966] mt-2">
              <span className="text-[#a8a6a0]">●</span> Archived · 312 responses
            </p>
          </div>
          <div className="flex-1 min-w-[160px] max-w-[220px] rounded-[10px] border border-[#e5e3dc] bg-white p-4 shadow-sm relative">
            <button type="button" className="absolute top-3 right-3 text-[#a8a6a0] hover:text-[#393939] cursor-pointer" aria-label="Remove">
              <RiCloseLine size={16} />
            </button>
            <span className="text-[10px] font-semibold text-[#a8a6a0] uppercase tracking-wide">Compare B</span>
            <p className="text-[14px] font-semibold text-[#1a1a1c] mt-1">Product Feedback Survey</p>
            <p className="text-[12px] text-[#6b6966] mt-2">
              <span className="text-[#e8a317]">●</span> Draft · 0 responses
            </p>
          </div>
          <button
            type="button"
            className="min-w-[160px] max-w-[220px] flex-1 rounded-[10px] border-2 border-dashed border-[#d8d6d0] bg-[#fafaf8] flex flex-col items-center justify-center gap-2 py-8 text-[13px] font-medium text-[#6b6966] hover:border-[#c9c7bf] hover:bg-[#f4f3ef] cursor-pointer transition-colors"
          >
            <RiAddLine size={20} />
            Add form
          </button>
        </div>
      </div>

      <div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-3">
          <p className="text-[10px] font-semibold text-[#888780] tracking-[0.65px] uppercase">
            Select metrics to compare
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-[8px] border border-[#e5e3dc] overflow-hidden bg-[#f4f3ef] p-0.5">
              <button
                type="button"
                onClick={() => setView('chart')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium cursor-pointer ${
                  view === 'chart' ? 'bg-[#17160e] text-white' : 'text-[#646464] hover:text-[#1a1a1c]'
                }`}
              >
                <RiBarChartBoxLine size={14} />
                Chart
              </button>
              <button
                type="button"
                onClick={() => setView('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium cursor-pointer ${
                  view === 'table' ? 'bg-[#17160e] text-white' : 'text-[#646464] hover:text-[#1a1a1c]'
                }`}
              >
                <RiTableLine size={14} />
                Table
              </button>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-[#e5e3dc] text-[12px] text-[#393939] hover:bg-[#f4f3ef] cursor-pointer"
            >
              <RiFilter3Line size={14} />
              Filter
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-[#e5e3dc] text-[12px] text-[#393939] hover:bg-[#f4f3ef] cursor-pointer"
            >
              <RiDownloadLine size={14} />
              Export
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {['All metrics', 'Completion rate', 'NPS score', 'Total responses'].map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-[6px] bg-[#2c2c2e] text-[11px] font-medium text-white"
            >
              {m}
              <RiCloseLine size={12} className="opacity-70 hover:opacity-100 cursor-pointer" />
            </span>
          ))}
          <button
            type="button"
            className="inline-flex items-center px-2.5 py-1 rounded-[6px] border border-dashed border-[#c9c7bf] text-[11px] font-medium text-[#6b6966] hover:bg-[#f4f3ef] cursor-pointer"
          >
            + Add more
          </button>
        </div>
      </div>

      <div className="rounded-[10px] bg-[#fafaf8] border border-[#e8e8e5] px-4 py-3 flex gap-3 items-start">
        <div className="w-9 h-9 rounded-[8px] bg-[#ede7ff] flex items-center justify-center shrink-0 text-[#5b21b6] text-lg font-semibold">
          ✦
        </div>
        <p className="text-[13px] text-[#393939] leading-relaxed pt-1">
          <strong className="font-semibold text-[#1a1a1c]">Strong → Q1 2026 vs Q4 2025:</strong>{' '}
          Completion is softer early in the funnel but recovery on longer sessions suggests messaging changes between quarters
          — prioritize Q2 copy tests.
        </p>
      </div>

      {view === 'chart' ? (
        <div className="bg-white border border-[#e5e3dc] rounded-[12px] p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-[14px] font-semibold text-[#1a1a1c]">Trend comparison over 30 days</p>
              <p className="text-[12px] text-[#6b6966] mt-1">Switch metric below to compare different dimensions</p>
            </div>
            <div className="flex flex-wrap gap-4 text-[11px] text-[#646464]">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#7c3aed]" /> NPS Q1 2026
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#94a3b8]" /> NPS Q4 2025
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#f59e0b]" /> Product Feedback
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {['Completion rate', 'NPS score', 'Responses / day', 'Avg. time', 'Sentiment'].map((t) => (
              <button
                key={t}
                type="button"
                className={`px-3 py-1.5 rounded-[6px] text-[11px] font-medium border cursor-pointer ${
                  t === 'Completion rate'
                    ? 'bg-[#17160e] text-white border-[#17160e]'
                    : 'bg-white text-[#646464] border-[#e5e3dc] hover:bg-[#f4f3ef]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 640 200" className="w-full h-[200px]" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <line key={i} x1="40" y1={40 + i * 40} x2="620" y2={40 + i * 40} stroke="#eeece8" strokeWidth="1" />
            ))}
            <polyline
              fill="none"
              stroke="#7c3aed"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="40,140 120,120 200,130 280,90 360,100 440,75 520,85 600,70"
            />
            <polyline
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="40,150 120,135 200,145 280,110 360,115 440,95 520,100 600,88"
            />
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
              points="40,175 120,175 200,175 280,175 360,175 440,175 520,175 600,175"
            />
          </svg>
          <div className="flex justify-between text-[10px] text-[#a8a6a0] px-2 mt-1">
            <span>Mar 14</span>
            <span>Apr 14</span>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#e5e3dc] rounded-[12px] overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e3dc] bg-[#fafaf8]">
            <span className="text-[13px] font-semibold text-[#1a1a1c]">Detailed metric comparison</span>
            <div className="flex items-center gap-2">
              <select className="text-[12px] border border-[#e5e3dc] rounded-[6px] px-2 py-1 bg-white">
                <option>All metrics</option>
              </select>
              <button type="button" className="inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded-[6px] border border-[#e5e3dc] hover:bg-[#f4f3ef] cursor-pointer">
                <RiDownloadLine size={14} />
                Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#e5e3dc] bg-[#fcfcfb]">
                  <th className="text-left px-4 py-2.5 font-semibold text-[#6b6966]">Metric</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#6b6966]">NPS Q1 2026 (current)</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#6b6966]">NPS Q4 2025</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#6b6966]">Product Feedback</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#6b6966]">Change (Q1 vs Q4)</th>
                </tr>
              </thead>
              <tbody>
                {METRIC_ROWS.map((row) => (
                  <tr key={row.metric} className="border-b border-[#f4f3ef] hover:bg-[#fcfcfb]">
                    <td className="px-4 py-2.5 font-medium text-[#393939]">{row.metric}</td>
                    <td className={`px-4 py-2.5 ${row.metric === 'Completion rate' ? 'text-[#fb1a00] font-medium' : 'text-[#393939]'}`}>
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
        </div>
      )}
    </div>
  );
}

export default AnalyticsComparePanel;
