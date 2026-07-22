import { motion } from 'motion/react';

export const RESPONSES_VIEWS = [
  { id: 'all', label: 'All responses' },
  { id: 'best', label: 'Best responses' },
];

export default function AnalyticsResponsesSubNav({ value, onChange }) {
  return (
    <nav
      className="flex items-center gap-1 border-b border-[rgba(0,0,0,0.08)] pb-3"
      aria-label="Responses views"
    >
      {RESPONSES_VIEWS.map((view) => {
        const isActive = value === view.id;
        return (
          <button
            key={view.id}
            type="button"
            onClick={() => onChange(view.id)}
            className={`relative shrink-0 px-3 h-8 text-[13px] rounded-[8px] cursor-pointer transition-colors duration-200 ease-out ${
              isActive
                ? 'font-medium text-[#17160e]'
                : 'text-[#646464] hover:text-[#17160e] hover:bg-black/[0.035]'
            }`}
          >
            {isActive ? (
              <motion.span
                layoutId="analytics-responses-subnav"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 rounded-[8px] bg-black/[0.06]"
                aria-hidden
              />
            ) : null}
            <span className="relative z-10">{view.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
