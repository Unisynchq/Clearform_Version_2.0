import { useState } from 'react';
import { motion } from 'motion/react';
import { RiArrowRightSLine } from 'react-icons/ri';
import MoreDetailsTrigger from './MoreDetailsTrigger';
import EffortDots from './EffortDots';

function RecommendedActionCompactCell({ action }) {
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
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="shrink-0 rounded-[10px] border border-[rgba(152,16,250,0.2)] bg-white px-3 py-2 text-[12.5px] font-semibold text-[#15140e] cursor-pointer whitespace-nowrap"
        >
          Take action →
        </motion.button>
      </div>
    </div>
  );
}

function RecommendedActionsExpanded({ actions = [] }) {
  return (
    <div className="rounded-[16px] border border-[#e8e8e3] bg-white p-px shadow-[0px_24px_80px_rgba(0,0,0,0.18),0px_8px_24px_rgba(0,0,0,0.08)]">
      <div className="border-b border-[#efefeb]">
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
            </div>
          ))}
        </div>
      </div>
      {actions.map((a, idx) => (
        <div
          key={a.index}
          className={`@container grid grid-cols-1 gap-4 border-b border-[#efefeb] px-5 py-5 @md:grid-cols-[28px_1fr_minmax(120px,140px)] @md:gap-x-4 @md:px-7 ${
            idx === actions.length - 1 ? 'border-b-0' : ''
          }`}
        >
          <div className="hidden text-[11px] font-semibold tracking-[0.44px] text-[#9b9b95] @md:block">
            {a.index}
          </div>
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
            </div>
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
            </div>
            <div className="flex flex-wrap gap-4 pt-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10.5px] font-medium uppercase tracking-[0.735px] text-[#9b9b95]">
                  Est. impact
                </span>
                <span className="text-[12.5px] font-semibold text-[#1a1a18]">{a.estImpact}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10.5px] font-medium uppercase tracking-[0.735px] text-[#9b9b95]">
                  Users affected
                </span>
                <span className="text-[12.5px] font-semibold text-[#1a1a18]">{a.usersAffected}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10.5px] font-medium uppercase tracking-[0.735px] text-[#9b9b95]">
                  Confidence
                </span>
                <span className="text-[12.5px] font-semibold text-[#1a1a18]">{a.confidence}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[#9b9b95]">Effort</span>
              <EffortDots filled={a.effortFilled} total={5} />
              <span className="pl-0.5 text-[11px] text-[#9b9b95]">{a.effortLabel}</span>
            </div>
          </div>
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
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RecommendedActionsCard({ compactActions, expandedActions }) {
  const [expanded, setExpanded] = useState(false);
  const compact = compactActions ?? [];
  const expandedList = expandedActions ?? [];

  if (compact.length === 0 && expandedList.length === 0) {
    return (
      <div className="flex flex-col gap-[20.574px] overflow-hidden rounded-[18px] border-[1.286px] border-[rgba(0,0,0,0.11)] bg-white px-[30px] py-[27px]">
        <p className="text-[16px] font-semibold leading-[25.075px] text-[#15140e]">Recommended Actions</p>
        <p className="text-[13px] text-[#9b9b95]">No recommended actions yet. Insights will appear once analysis completes.</p>
      </div>
    );
  }

  if (expanded) {
    return (
      <div>
        <div className="mb-[18px] flex items-start justify-between">
          <div className="min-w-0 pr-4">
            <p className="text-[18px] font-semibold leading-[21.6px] tracking-[-0.36px] text-[#1a1a18]">
              Recommended Actions
            </p>
            <p className="mt-1 text-[13px] font-normal leading-normal text-[#9b9b95]">
              AI-prioritised based on impact & effort · {expandedList.length} actions
              total
            </p>
          </div>
          <MoreDetailsTrigger open={expanded} onClick={() => setExpanded(false)} />
        </div>
        <RecommendedActionsExpanded actions={expandedList} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[20.574px] overflow-hidden rounded-[18px] border-[1.286px] border-[rgba(0,0,0,0.11)] bg-white px-[30px] py-[27px]">
      <div className="flex items-center justify-between">
        <p className="text-[16px] font-semibold leading-[25.075px] text-[#15140e]">Recommended Actions</p>
        <MoreDetailsTrigger open={expanded} onClick={() => setExpanded(true)} />
      </div>
      <div className="overflow-hidden rounded-[12.859px] bg-[rgba(0,0,0,0.07)] p-px">
        <div className="grid grid-cols-1 gap-px md:grid-cols-3">
          {compact.map((action) => (
            <RecommendedActionCompactCell key={action.index} action={action} />
          ))}
        </div>
      </div>
    </div>
  );
}
