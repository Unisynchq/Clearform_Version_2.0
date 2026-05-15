import { AnimatePresence, motion } from 'motion/react';
import { PROFILE_TABS, PROFILE_TAB_META } from './profileSettingsConfig';

const tabEase = [0.22, 1, 0.36, 1];

export default function ProfileSettingsShell({ activeTab, onTabChange, children }) {
  const meta = PROFILE_TAB_META[activeTab] ?? PROFILE_TAB_META.profile;

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 px-8 pb-9 pt-9">
      <header className="pb-1">
        <h1 className="text-[22px] font-semibold tracking-[-0.4px] text-[#1a1a18]">{meta.title}</h1>
        <p className="mt-1 text-[13.5px] text-[#6b6b68]">{meta.subtitle}</p>
      </header>

      <nav
        className="flex gap-8 border-b border-[#e8e8e6]/80"
        aria-label="Profile settings sections"
      >
        {PROFILE_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`border-b-2 px-0 pb-[11px] pt-1 text-[13.5px] font-medium transition-colors ${
                isActive
                  ? 'border-[#1a1a18] text-[#1a1a18]'
                  : 'border-transparent text-[#9e9e9a] hover:text-[#6b6b68]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.32, ease: tabEase }}
          className="flex w-full min-w-0 flex-col gap-4"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
