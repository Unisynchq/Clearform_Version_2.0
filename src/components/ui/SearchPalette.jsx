import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import {
  RiEditLine,
  RiGroupLine,
  RiFileCopyLine,
  RiLayoutGridLine,
  RiBarChartLine,
  RiSettings3Line,
  RiAddLine,
  RiLink,
  RiSearchLine,
} from 'react-icons/ri';

/* ─── Recent search mock data ──────────────────────────────────────────────── */
const RECENT_SEARCHES = [
  { label: 'NPS Survey Q1', color: '#2e7d52' },
  { label: 'Onboarding', color: '#1d6fd8' },
  { label: 'Marketing CSAT', color: '#b45309' },
  { label: 'Exit Interview', color: '#6b6966' },
];

/* ─── Keyboard badge ───────────────────────────────────────────────────────── */
const Kbd = ({ children }) => (
  <span className="inline-flex items-center bg-[#f4f3ef] border border-[#e5e3dc] text-[#a8a6a0] text-[10px] font-normal px-[7px] py-[2px] rounded-[4px] leading-normal whitespace-nowrap shrink-0">
    {children}
  </span>
);

/* ─── Icon box ─────────────────────────────────────────────────────────────── */
const IconBox = ({ icon: Icon, bg = '#f4f3ef', borderColor = '#e5e3dc', color = '#6b6966' }) => (
  <div
    className="flex items-center justify-center rounded-[7px] shrink-0 border"
    style={{ width: 28, height: 28, background: bg, borderColor }}
  >
    <Icon size={13} style={{ color }} />
  </div>
);

/* ─── Section label ────────────────────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
  <p className="px-4 pt-3 pb-[6px] text-[10px] font-semibold text-[#a8a6a0] tracking-[1px] uppercase leading-normal">
    {children}
  </p>
);

/* ─── Row item ─────────────────────────────────────────────────────────────── */
const RowItem = ({
  icon, iconBg, iconBorderColor, iconColor,
  title, subtitle, badge, badgeCls, kbd, active = false, onClick,
}) => (
  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-[8px] text-left transition-colors cursor-pointer ${
      active ? 'bg-[#f4f3ef]' : 'hover:bg-[#f4f3ef]'
    }`}
  >
    <IconBox icon={icon} bg={iconBg} borderColor={iconBorderColor} color={iconColor} />
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-medium text-[#1a1a1c] leading-snug truncate">{title}</p>
      {subtitle && (
        <p className="text-[11px] text-[#a8a6a0] leading-snug truncate">{subtitle}</p>
      )}
    </div>
    {badge && (
      <span className={`text-[10px] font-medium px-[7px] py-[2px] rounded-full whitespace-nowrap shrink-0 ${badgeCls}`}>
        {badge}
      </span>
    )}
    {kbd && <Kbd>{kbd}</Kbd>}
  </button>
);

/* ─── Divider ──────────────────────────────────────────────────────────────── */
const Divider = () => <div className="h-px bg-[#e5e3dc] mx-4" />;

/* ─── Default state ────────────────────────────────────────────────────────── */
const DefaultState = ({ onSelectRecent, onClose }) => (
  <div>
    <SectionLabel>Recent Searches</SectionLabel>
    <div className="flex flex-wrap gap-[6px] px-4 pb-3">
      {RECENT_SEARCHES.map(({ label, color }) => (
        <button
          key={label}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelectRecent(label)}
          className="flex items-center gap-[6px] bg-white border border-[#e5e3dc] rounded-full px-3 py-[5px] text-[12px] text-[#1a1a1c] hover:bg-[#f4f3ef] transition-colors leading-normal"
        >
          <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: color }} />
          {label}
        </button>
      ))}
    </div>

    <Divider />

    <SectionLabel>Jump To</SectionLabel>
    <div className="pb-2">
      <RowItem icon={RiLayoutGridLine} title="All Forms" kbd="G F" onClick={onClose} />
      <RowItem icon={RiBarChartLine} title="Analytics" kbd="G A" />
      <RowItem icon={RiAddLine} title="Create new form" kbd="⌘N" />
    </div>
  </div>
);

/* ─── Filled state ─────────────────────────────────────────────────────────── */
const FilledState = ({ matchingForms, query, onFormClick, onClose }) => (
  <div>
    <SectionLabel>Forms matching &ldquo;{query}&rdquo;</SectionLabel>
    <div className="flex flex-col">
      {matchingForms.map((form, i) => (
        <RowItem
          key={form.id}
          icon={RiFileCopyLine}
          iconBg={i === 0 ? '#eff0ff' : '#f4f3ef'}
          iconBorderColor={i === 0 ? '#d5d7ff' : '#e5e3dc'}
          iconColor={i === 0 ? '#6b78ff' : '#6b6966'}
          title={form.title}
          subtitle={`${form.workspace} · ${form.responses} responses`}
          badge={
            form.status === 'live' ? 'Live'
            : form.status === 'draft' ? 'Draft'
            : 'Archived'
          }
          badgeCls={
            form.status === 'live' ? 'bg-[#e6f5ee] text-[#2d7a53]'
            : form.status === 'draft' ? 'bg-[#fef3cd] text-[#b45309]'
            : 'bg-[#f4f3ef] text-[#6b6966]'
          }
          active={i === 0}
          onClick={() => onFormClick(form)}
        />
      ))}
    </div>

    <Divider />

    <SectionLabel>Actions</SectionLabel>
    <div className="flex flex-col">
      <RowItem
        icon={RiEditLine}
        title={`Edit "${matchingForms[0].title}"`}
        subtitle="Open form builder"
        kbd="⌘E"
      />
      <RowItem
        icon={RiGroupLine}
        title={`View responses for "${matchingForms[0].title}"`}
        subtitle="Open response table"
        kbd="⌘R"
      />
      <RowItem
        icon={RiLink}
        title="Copy form link"
        subtitle={`form.clearform.io/${matchingForms[0].title.toLowerCase().replace(/\s+/g, '-')}`}
        kbd="⌘C"
      />
    </div>

    <Divider />

    <SectionLabel>Navigate</SectionLabel>
    <div className="flex flex-col pb-1">
      <RowItem icon={RiLayoutGridLine} title="All Forms" kbd="G F" onClick={onClose} />
      <RowItem icon={RiSettings3Line} title="Settings" kbd="G S" />
      <RowItem icon={RiAddLine} title="Create new form" kbd="⌘N" />
    </div>
  </div>
);

/* ─── Empty state ──────────────────────────────────────────────────────────── */
const EmptyState = ({ query }) => (
  <div>
    <div className="flex flex-col items-center justify-center py-10 px-6 gap-3">
      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#f4f3ef] border border-[#e5e3dc]">
        <RiSearchLine size={17} className="text-[#a8a6a0]" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-[13px] font-medium text-[#1a1a1c] leading-snug">
          No results for &ldquo;{query}&rdquo;
        </p>
        <p className="text-[12px] text-[#a8a6a0] leading-snug">
          Try a different search or create a new form
        </p>
      </div>
    </div>
    <div className="px-4 pb-4">
      <button
        onMouseDown={(e) => e.preventDefault()}
        className="w-full flex items-center justify-between px-3 py-2 border border-[#e5e3dc] rounded-[8px] text-[13px] text-[#1a1a1c] hover:bg-[#f4f3ef] transition-colors"
      >
        <div className="flex items-center gap-2">
          <RiAddLine size={14} className="text-[#6b6966]" />
          <span className="font-medium">Create new form</span>
        </div>
        <Kbd>⌘N</Kbd>
      </button>
    </div>
  </div>
);

/* ─── SearchDropdown — pure dropdown panel, no own input ────────────────────── */
const SearchDropdown = ({ open, query, anchorRef, onClose, onSelectRecent, onFormClick }) => {
  const forms = useSelector((s) => s.forms.forms);
  const searchResults = useSelector((s) => s.forms.searchResults);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 400 });

  /* Recalculate position whenever the dropdown opens */
  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [open, anchorRef]);

  const trimmed = query.trim();
  const matchingForms = trimmed ? searchResults : [];

  const isDefault = !trimmed;
  const hasResults = matchingForms.length > 0;
  const isEmpty = trimmed.length > 0 && !hasResults;

  const handleFormClick = (form) => {
    onFormClick(form);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — dims the background, click closes dropdown */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onMouseDown={onClose}
            className="fixed inset-0 z-400 bg-black/30"
          />

          {/* Dropdown panel — fixed just below the search bar */}
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.13, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed z-401 bg-white border border-[#e5e3dc] rounded-[12px] shadow-[0_12px_40px_rgba(0,0,0,0.14)] overflow-hidden"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <div className="max-h-[520px] overflow-y-auto">
              {isDefault && (
                <DefaultState
                  onSelectRecent={onSelectRecent}
                  onClose={onClose}
                />
              )}
              {isEmpty && <EmptyState query={query} />}
              {hasResults && (
                <FilledState
                  matchingForms={matchingForms}
                  query={query}
                  onFormClick={handleFormClick}
                  onClose={onClose}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchDropdown;
