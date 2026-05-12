import { useMemo, useState } from 'react';
import {
  RiSearchLine,
  RiTimeLine,
  RiArrowDownSLine,
  RiListCheck2,
  RiChat3Line,
} from 'react-icons/ri';

const MOCK_ROWS = [
  ['swapnil.vyas921@gmail.com', '20 Dec 2025 20:14', 'Completed', 'Manager', '1-5', 'Calls · WhatsApp', '—'],
  ['—', '20 Dec 2025 18:02', 'Completed', 'Founder', '6-15', 'In-person · Dedicated tool', '—'],
  ['vasundhara.tadimalla@gmail.com', '19 Dec 2025 09:41', 'Completed', 'Team Lead', '16-30', 'Google Forms', '—'],
  ['—', '18 Dec 2025 22:15', 'Completed', 'Other', '1-5', 'Calls', '—'],
  ['—', '17 Dec 2025 14:30', 'Completed', 'Manager', '6-15', 'WhatsApp · Email', '—'],
  ['feedback@acme.co', '16 Dec 2025 11:08', 'Completed', 'Team Lead', '16-30', 'Dedicated tool', '—'],
  ['—', '15 Dec 2025 19:55', 'Completed', 'Other', '1-5', 'In-person', '—'],
  ['—', '14 Dec 2025 08:12', 'Completed', 'Manager', '6-15', 'Calls · WhatsApp · Email', '—'],
  ['—', '13 Dec 2025 16:44', 'Completed', 'Founder', '1-5', 'Google Forms', '—'],
  ['—', '12 Dec 2025 12:01', 'Completed', 'Team Lead', '16-30', 'Dedicated tool · Calls', '—'],
];

const HEADERS = [
  { label: "If you answered 'Det…", Icon: null },
  { label: 'Response time', Icon: RiTimeLine },
  { label: 'Response type', Icon: RiChat3Line },
  { label: 'What best describes your role?', Icon: RiListCheck2 },
  { label: 'What is your team size?', Icon: RiListCheck2 },
  { label: 'How do you collect feedback?', Icon: RiListCheck2 },
  { label: 'Frustrations', Icon: RiListCheck2 },
];

function AnalyticsResponsesPanel({ rangeLabel }) {
  const [search, setSearch] = useState('');
  const [localRangeOpen, setLocalRangeOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_ROWS;
    const q = search.toLowerCase();
    return MOCK_ROWS.filter((row) => row.some((cell) => String(cell).toLowerCase().includes(q)));
  }, [search]);

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-[320px]">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a6a0]" size={16} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search responses"
            className="w-full pl-9 pr-3 py-2 rounded-[8px] border border-[#e5e3dc] text-[13px] text-[#1a1a1c] placeholder-[#a8a6a0] outline-none focus:border-[#17160e] bg-white"
          />
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setLocalRangeOpen((o) => !o)}
            className="flex items-center gap-2 h-9 px-3 rounded-[8px] border border-[#e8e6e0] text-[12px] text-[#646464] hover:bg-white bg-[#fafaf8] cursor-pointer"
          >
            <RiTimeLine size={16} />
            <span>{rangeLabel}</span>
            <RiArrowDownSLine size={14} className={`transition-transform ${localRangeOpen ? 'rotate-180' : ''}`} />
          </button>
          {localRangeOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-20 min-w-[160px] bg-white border border-[#e5e3dc] rounded-[10px] shadow-lg py-1">
              {['All time', 'Last 7 days', 'Last 30 days'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#f4f3ef]"
                  onClick={() => setLocalRangeOpen(false)}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#e5e3dc] rounded-[12px] overflow-hidden shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse text-left text-[12px]">
            <thead>
              <tr className="bg-[#fafaf8] border-b border-[#e5e3dc]">
                {HEADERS.map((h) => {
                  const Icon = h.Icon;
                  return (
                  <th key={h.label} className="px-3 py-2.5 font-medium text-[#6b6966] whitespace-nowrap border-r border-[#eeece8] last:border-r-0">
                    <span className="inline-flex items-center gap-1.5">
                      {Icon && <Icon size={13} className="text-[#a8a6a0] shrink-0" />}
                      {h.label}
                      <RiArrowDownSLine size={12} className="text-[#c9c7bf] shrink-0 opacity-70" />
                    </span>
                  </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, ri) => (
                <tr key={ri} className="border-b border-[#eeece8] hover:bg-[#fcfcfb]">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-3 text-[#393939] border-r border-[#f4f3ef] last:border-r-0 align-top max-w-[200px]">
                      {ci === 2 ? (
                        <span className="inline-flex px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-[#eafaf1] text-[#2e7d52] border border-[#c8ead4]">
                          {cell}
                        </span>
                      ) : (
                        <span className="leading-snug whitespace-pre-wrap">{cell}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[#e5e3dc] text-[12px] text-[#6b6966] bg-[#fafaf8]">
          {filtered.length} of 248 responses
        </div>
      </div>
    </div>
  );
}

export default AnalyticsResponsesPanel;
