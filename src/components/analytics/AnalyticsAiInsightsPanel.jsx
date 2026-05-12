import { RiSparklingLine, RiArrowRightLine, RiLightbulbLine, RiAlertLine } from 'react-icons/ri';

const FINDINGS = [
  {
    title: 'Friction at Q2–Q3',
    body: 'Promoters skim past “role” but detractors stall—consider shortening optional fields.',
    tone: 'warn',
    Icon: RiAlertLine,
  },
  {
    title: 'Completion velocity',
    body: 'Median time improved vs last quarter; mobile completes ~40s faster.',
    tone: 'good',
    Icon: RiLightbulbLine,
  },
  {
    title: 'Channel mix',
    body: 'WhatsApp referrals convert higher than email invites—rebalance outreach.',
    tone: 'neutral',
    Icon: RiSparklingLine,
  },
];

function AnalyticsAiInsightsPanel({ formTitle }) {
  return (
    <div className="max-w-[900px] mx-auto flex flex-col gap-6">
      <div className="rounded-[12px] border border-[#ede7ff] bg-gradient-to-br from-[#faf8ff] to-[#f4f3ef] p-6 flex gap-4 shadow-sm">
        <div className="w-11 h-11 rounded-[10px] bg-[#7c3aed] flex items-center justify-center shrink-0 text-white">
          <RiSparklingLine size={22} />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-[#7c3aed] uppercase tracking-wide mb-1">AI summary</p>
          <p className="text-[16px] font-semibold text-[#1a1a1c] leading-snug">
            {formTitle ?? 'This form'} — completion trails industry benchmarks, but engaged users finish faster than Q4.
          </p>
          <p className="text-[13px] text-[#6b6966] mt-2 leading-relaxed">
            Focus on Q2 drop-off and experiment with one fewer required field before the NPS scale.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-[#888780] tracking-[0.65px] uppercase mb-3">Key findings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FINDINGS.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-[#e5e3dc] rounded-[10px] p-4 flex flex-col gap-2 shadow-sm"
            >
              <f.Icon
                size={18}
                className={
                  f.tone === 'warn'
                    ? 'text-[#d97706]'
                    : f.tone === 'good'
                      ? 'text-[#16a34a]'
                      : 'text-[#7c3aed]'
                }
              />
              <p className="text-[13px] font-semibold text-[#1a1a1c]">{f.title}</p>
              <p className="text-[12px] text-[#6b6966] leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#e5e3dc] rounded-[12px] p-5 shadow-sm">
        <h3 className="text-[13px] font-semibold text-[#1a1a1c] mb-4">Suggested next steps</h3>
        <ul className="flex flex-col gap-3">
          {[
            'A/B test Q2 helper text against a single-select variant.',
            'Add reminder email 48h after partial submission.',
            'Pin “typical” daily volume on Performance to spot outliers faster.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-[13px] text-[#393939]">
              <RiArrowRightLine className="text-[#7c3aed] shrink-0 mt-0.5" size={16} />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AnalyticsAiInsightsPanel;
