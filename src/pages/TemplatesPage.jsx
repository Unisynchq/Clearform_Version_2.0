import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { RiSearchLine, RiCloseLine, RiTimeLine, RiFileAddLine, RiFireFill } from 'react-icons/ri';
import { LuFolderOpen } from 'react-icons/lu';
import {
  LuBriefcase,
  LuGraduationCap,
  LuWrench,
  LuClipboardList,
  LuScale,
  LuGauge,
  LuFlaskConical,
  LuFileText,
  LuLightbulb,
} from 'react-icons/lu';
import TemplatesSkeleton from '../components/ui/TemplatesSkeleton';
import TemplatesPartialSkeleton from '../components/ui/TemplatesPartialSkeleton';
import CreateCustomFormBanner from '../components/ui/CreateCustomFormBanner';
import { useToast } from '../hooks/useToast';

/* Plan limit drives the E5 (limit) banner state — when the workspace is at or
   over this number of forms, the create CTA is replaced with an Upgrade CTA. */
const PLAN_LIMIT = 10;
/* How long the loading state lingers before resolving to success/error. */
const CREATE_LATENCY_MS = 1600;

/* Loading stages — full skeleton, then partial (chrome loaded, cards still loading), then content. */
const FULL_SKELETON_MS = 700;
const PARTIAL_SKELETON_MS = 800;

const FILTER_TABS = ['All', 'HR & Recruitment', 'Support', 'Research', 'Education', 'Legal'];

const RECENT_SEARCHES = ['feedback survey', 'HR onboarding', 'NPS'];

/* Static "Did you mean…" suggestions shown when a search has no matches.
   Mix of popular search terms and category names — matches Figma frame "Search - No Result". */
const DID_YOU_MEAN = ['feedback survey', 'HR & Recruitment', 'Performance reviews'];

/* `badges` controls the NEW (next to title) + POPULAR (in tag row, with fire icon)
   pills. Matches the C3 state in the Figma "Template Card — All States" frame. */
const TEMPLATES = [
  {
    id: 1,
    icon: '💼',
    LuIcon: LuBriefcase,
    title: 'Job Applications — High-Quality Roles',
    description:
      'Streamline your hiring process for competitive positions with structured evaluation criteria that ensure fairness and depth in candidate assessment.',
    tag: 'HR & RECRUITMENT',
    filter: 'HR & Recruitment',
  },
  {
    id: 2,
    icon: '🎓',
    LuIcon: LuGraduationCap,
    title: 'Grant & Scholarship Applications',
    description:
      'Built for foundations, universities, and NGOs running competitive, high-value funding programs — where fairness and depth both matter.',
    tag: 'EDUCATION & FUNDING',
    filter: 'Education',
  },
  {
    id: 3,
    icon: '🛠️',
    LuIcon: LuWrench,
    title: 'Customer Support — Complex & Technical Issues',
    description:
      'Capture detailed information about complex technical problems, enabling your support team to provide more effective solutions faster.',
    tag: 'SUPPORT',
    filter: 'Support',
    badges: { new: true, popular: true },
  },
  {
    id: 4,
    icon: '📋',
    LuIcon: LuClipboardList,
    title: 'Consulting & Service Client Intake',
    description:
      'Professional client onboarding forms that gather comprehensive project requirements and expectations from the start.',
    tag: 'PROFESSIONAL SERVICES',
    filter: 'Legal',
  },
  {
    id: 5,
    icon: '⚖️',
    LuIcon: LuScale,
    title: 'Compliance, Legal & Financial Submissions',
    description:
      'Secure and thorough forms for handling sensitive compliance, legal documentation, and financial information submissions.',
    tag: 'COMPLIANCE',
    filter: 'Legal',
  },
  {
    id: 6,
    icon: '📊',
    LuIcon: LuGauge,
    title: 'Performance Reviews & Internal Evaluations',
    description:
      'Comprehensive employee performance review templates that encourage thoughtful feedback and meaningful professional development.',
    tag: 'HR & MANAGEMENT',
    filter: 'HR & Recruitment',
    badges: { popular: true },
  },
  {
    id: 7,
    icon: '🔬',
    LuIcon: LuFlaskConical,
    title: 'Research Studies with Incentives',
    description:
      'Perfect for academic researchers, UX teams, and market researchers who need high-quality qualitative responses — not just completed forms.',
    tag: 'RESEARCH',
    filter: 'Research',
    badges: { new: true },
  },
  {
    id: 8,
    icon: '📝',
    LuIcon: LuFileText,
    title: 'RFP & Vendor Submissions (Procurement)',
    description:
      'Structured request for proposal templates that help you collect detailed vendor responses and make informed procurement decisions.',
    tag: 'PROCUREMENT',
    filter: 'Legal',
  },
  {
    id: 9,
    icon: '💡',
    LuIcon: LuLightbulb,
    title: 'EdTech & Learning Assessment',
    description:
      'Designed for online learning platforms, bootcamps, and educators collecting reflective assignments — where the quality of thinking matters more than the volume of words.',
    tag: 'EDUCATION',
    filter: 'Education',
    badges: { new: true },
  },
];

/* ── NEW pill — sits inline next to the card title.
   Matches Figma node 1139:45060 ("Background+Border" with "NEW" text). */
const NewBadge = () => (
  <span className="inline-flex items-center bg-[#f4f4f4] border border-[#a0a0a0] rounded-[999px] px-[9px] py-[2px] text-[10px] font-bold text-[#1a1a1c] uppercase tracking-[0.4px] leading-[15px] whitespace-nowrap shrink-0">
    NEW
  </span>
);

/* ── POPULAR pill — sits in the tag row, with a flame icon.
   Matches Figma node 1139:45065 (amber/brown accent on neutral bg). */
const PopularBadge = () => (
  <span className="inline-flex items-center gap-[6px] bg-[#f7f6f3] border border-[rgba(146,64,14,0.2)] rounded-[4px] px-[12px] py-[4px] text-[11px] font-medium text-[#92400e] tracking-[0.5px] uppercase leading-[16.5px] whitespace-nowrap">
    <RiFireFill size={12} className="text-[#92400e]" />
    Popular
  </span>
);

/* ── Loading overlay (C4) — shown while a template is being instantiated.
   Matches Figma node 1139:45082 ("Loading overlay") + 1139:45083 (spinner row). */
const LoadingOverlay = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.18 }}
    className="absolute inset-0 bg-[rgba(219,219,219,0.7)] flex items-center justify-center rounded-[12px] z-10"
  >
    <div className="flex items-center gap-[8px]">
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        className="w-[16px] h-[16px] border-2 border-[#1a1a1c] border-r-transparent rounded-full"
      />
      <span className="text-[12px] font-medium text-[#1a1a1c] leading-[18px]">
        Creating form…
      </span>
    </div>
  </motion.div>
);

/* ── Template Card (main grid) — renders C1 (default), C2 (hover with action row),
   C3 (NEW / POPULAR badges) and C4 (loading) states from the Figma "Template Card —
   All States" frame (1139:45208). */
const TemplateCard = ({ template, isLoading, anyLoading, onUseTemplate, onPreview }) => {
  const [isHovered, setIsHovered] = useState(false);
  const hasNew = !!template.badges?.new;
  const hasPopular = !!template.badges?.popular;
  const showActionRow = isHovered && !isLoading && !anyLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0, borderColor: showActionRow ? '#d4d2cb' : '#e8e7e2' }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ duration: 0.15 }}
      className={`relative bg-[#edeae3] border rounded-[12px] p-[25px] flex flex-col gap-0 ${
        isLoading ? 'cursor-default' : 'cursor-pointer'
      }`}
    >
      <div className="flex gap-4 items-start">
        <div className="w-[48px] h-[48px] shrink-0 bg-[#f7f6f3] rounded-[8px] flex items-center justify-center text-[24px]">
          {template.icon}
        </div>

        <div className="flex flex-col gap-0 flex-1 min-w-0">
          {/* Title row — NEW badge sits inline at the end (C3). */}
          <div className="flex items-start gap-[8px] mb-[8px] flex-wrap">
            <h3
              className="text-[16px] font-bold text-[#111110] leading-[22.4px] tracking-[-0.1px]"
              style={{ fontFamily: 'Arimo, sans-serif' }}
            >
              {template.title}
            </h3>
            {hasNew && <NewBadge />}
          </div>

          <p className="text-[14px] font-normal text-[#656565] leading-[22.4px] mb-[16px]">
            {template.description}
          </p>

          {/* Tag row — POPULAR (amber) sits before the category tag when present (C3). */}
          <div className="flex items-center gap-[8px] flex-wrap">
            {hasPopular && <PopularBadge />}
            <span className="inline-flex items-center bg-[#f7f6f3] rounded-[4px] px-[12px] py-[4px] text-[11px] font-medium text-[#656565] tracking-[0.5px] uppercase leading-[16.5px] whitespace-nowrap">
              {template.tag}
            </span>
          </div>

          {/* Action row (C2) — slides down on hover. AnimatePresence mounts/unmounts
             with smooth height + opacity so the card grows by the row height. */}
          <AnimatePresence initial={false}>
            {showActionRow && (
              <motion.div
                key="action-row"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 36, marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden"
              >
                <div className="flex gap-[8px] h-[36px]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview?.(template);
                    }}
                    className="flex-1 h-[36px] bg-white border border-[#e5e3dc] rounded-[8px] text-[11px] font-medium text-[#1a1a1c] hover:bg-[#fafaf7] transition-colors cursor-pointer"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUseTemplate?.(template);
                    }}
                    className="flex-1 h-[36px] bg-[#1a1a1c] border border-[#1a1a1c] rounded-[8px] text-[11px] font-medium text-white hover:bg-[#2c2c2e] transition-colors cursor-pointer"
                  >
                    Use template
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>{isLoading && <LoadingOverlay />}</AnimatePresence>
    </motion.div>
  );
};

/* ── Highlight matching substring inside a string ── */
const Highlight = ({ text, query }) => {
  if (!query) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <span className="bg-[#fff3b0] text-[#1a1a1c] rounded-[2px]">
        {text.slice(i, i + query.length)}
      </span>
      {text.slice(i + query.length)}
    </>
  );
};

/* ── Search Result Row inside the dropdown ── */
const SearchResultRow = ({ template, query, onSelect, isLast }) => {
  const { LuIcon } = template;
  const shortDesc =
    template.description.length > 64
      ? `${template.description.slice(0, 64).trimEnd()}…`
      : template.description;

  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect(template);
      }}
      className={`w-full bg-white text-left flex gap-[12px] items-start px-[16px] pt-[12px] pb-[13px] hover:bg-[#fafaf7] transition-colors cursor-pointer ${
        isLast ? '' : 'border-b border-[#e5e3dc]'
      }`}
    >
      <div className="w-[32px] h-[32px] shrink-0 bg-[#f4f3ef] border border-[#e5e3dc] rounded-[8px] flex items-center justify-center">
        <LuIcon size={16} className="text-[#6b6966]" />
      </div>
      <div className="flex flex-col gap-[3px] items-start flex-1 min-w-0">
        <span className="text-[12px] font-semibold text-[#1a1a1c] leading-[18px] truncate w-full">
          <Highlight text={template.title} query={query} />
        </span>
        <span className="text-[11px] font-normal text-[#6b6966] leading-[16.5px] truncate w-full pb-[2px]">
          {shortDesc}
        </span>
        <span className="inline-flex items-center border border-[#a0a0a0] rounded-[3px] px-[7px] pt-px pb-[2px] text-[9px] font-bold text-[#1a1a1c] uppercase leading-[13.5px] tracking-[0.3px] whitespace-nowrap">
          <Highlight text={template.tag} query={query} />
        </span>
      </div>
    </button>
  );
};

/* ── Disabled search bar — used by both empty and error states.
   Matches Figma node 1139:44783 / 1139:44877 ("Search disabled"). */
const DisabledSearch = () => (
  <div className="bg-[#f4f3ef] border border-[#e5e3dc] flex items-center gap-[8px] h-[30px] px-[13px] rounded-[8px] w-full">
    <RiSearchLine size={14} className="text-[#a8a6a0] shrink-0" />
    <span className="text-[11px] font-normal text-[#a8a6a0] leading-[16.5px] truncate">
      Search unavailable
    </span>
  </div>
);

/* ── Skeleton card cell (no shimmer, used for greyed-out error grid).
   Matches Figma node 1139:44884 et al. The whole grid is wrapped at 25% opacity. */
const GreyedCardCell = ({ Icon, borderRight, borderBottom, lineWidths }) => (
  <div
    className={`bg-white flex gap-[8px] items-start pl-[12px] pr-[13px] pt-[12px] pb-[13px]
      ${borderRight ? 'border-r border-[#e5e3dc]' : ''}
      ${borderBottom ? 'border-b border-[#e5e3dc]' : ''}`}
  >
    <div className="w-[24px] h-[24px] shrink-0 bg-[#f4f3ef] border border-[#e5e3dc] rounded-[4px] flex items-center justify-center">
      <Icon size={14} className="text-[#a8a6a0]" />
    </div>
    <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
      <div className="bg-[#e5e3dc] h-[11px] rounded-[3px]" style={{ width: lineWidths[0] }} />
      <div className="bg-[#e5e3dc] h-[8px] rounded-[3px] w-full" />
      <div className="bg-[#e5e3dc] h-[14px] rounded-[3px]" style={{ width: lineWidths[1] }} />
    </div>
  </div>
);

/* ── Greyed-out 2x2 grid used when template loading fails.
   Matches Figma node 1139:44883 ("Greyed-out grid"). */
const GreyedOutGrid = () => (
  <div className="border border-[#e5e3dc] rounded-[8px] overflow-hidden opacity-25">
    <div className="grid grid-cols-2">
      <GreyedCardCell Icon={LuBriefcase}     borderRight borderBottom lineWidths={[103, 50]} />
      <GreyedCardCell Icon={LuGauge}                     borderBottom lineWidths={[90, 60]} />
      <GreyedCardCell Icon={LuGraduationCap} borderRight                 lineWidths={[110, 45]} />
      <GreyedCardCell Icon={LuClipboardList}                              lineWidths={[97, 55]} />
    </div>
  </div>
);

/* ── Empty state body — "No templates available yet".
   Matches Figma node 1139:44789. */
const EmptyTemplatesBody = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22 }}
    className="flex flex-col items-center justify-center w-full h-[465px] px-[40px] py-[32px]"
  >
    <div className="w-[64px] h-[64px] bg-[#f4f3ef] border border-[#e5e3dc] rounded-[16px] flex items-center justify-center mb-[16px]">
      <LuFolderOpen size={24} className="text-[#6b6966]" />
    </div>
    <p className="text-[14px] font-medium text-[#1a1a1c] leading-[21px] text-center mb-[8px]">
      No templates available yet
    </p>
    <p className="text-[11px] font-normal text-[#6b6966] leading-[16.5px] text-center max-w-[240px] mb-[16px]">
      Our template library is being updated. Check back soon, or start from scratch.
    </p>
    <button
      type="button"
      className="bg-[#1a1a1c] border border-[#1a1a1c] text-white text-[12px] font-medium leading-none h-[28px] px-[13px] rounded-[8px] hover:bg-[#2c2c2e] transition-colors cursor-pointer"
    >
      Create Custom Form
    </button>
  </motion.div>
);

const TemplatesPage = () => {
  const [searchParams] = useSearchParams();
  /* `?state=empty` and `?state=error` force the empty/error variants for design previews —
     the production flow runs through the normal full → partial → loaded skeleton stages. */
  const stateOverride = searchParams.get('state');
  /* `?banner=default|loading|error|limit` pins the CTA banner to a specific
     state so designers can preview each variant without triggering the flow. */
  const bannerOverride = searchParams.get('banner');
  const formsCount = useSelector((s) => s.forms.forms.length);
  const [loadStage, setLoadStage] = useState('full');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  /* Increment on Retry to re-run the error attempt loop (skeleton → error). */
  const [errorAttempt, setErrorAttempt] = useState(0);
  /* Holds the id of the template currently being instantiated (drives the C4
     loading overlay on that card). Null when no template is being created. */
  const [loadingTemplateId, setLoadingTemplateId] = useState(null);
  /* Banner state machine — drives the four CTA banner variants.
     Resolves to E5 (limit) when the workspace is at or over PLAN_LIMIT,
     else E1 (default). 'loading' / 'error' are entered transiently when
     the user clicks "Create Custom Form". URL override wins over all. */
  const [bannerState, setBannerState] = useState('default');
  const createTimerRef = useRef(null);
  const loadingTimerRef = useRef(null);
  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const { showToast } = useToast();

  /* Resolve the banner state. URL override > active loading/error > limit > default. */
  const isAtLimit = formsCount >= PLAN_LIMIT;
  const resolvedBannerState =
    bannerOverride && ['default', 'loading', 'error', 'limit'].includes(bannerOverride)
      ? bannerOverride
      : bannerState === 'loading' || bannerState === 'error'
        ? bannerState
        : isAtLimit
          ? 'limit'
          : 'default';

  /* Progressive loading: full skeleton → partial skeleton → loaded.
     When `?state=` is set, we skip partial and go straight to the override state
     so designers don't have to wait through the full sequence to preview. */
  useEffect(() => {
    if (stateOverride === 'empty') {
      setLoadStage('full');
      const t = setTimeout(() => setLoadStage('empty'), FULL_SKELETON_MS);
      return () => clearTimeout(t);
    }
    if (stateOverride === 'error') {
      setLoadStage('full');
      const t = setTimeout(() => setLoadStage('error'), FULL_SKELETON_MS);
      return () => clearTimeout(t);
    }

    const t1 = setTimeout(() => setLoadStage('partial'), FULL_SKELETON_MS);
    const t2 = setTimeout(() => setLoadStage('loaded'), FULL_SKELETON_MS + PARTIAL_SKELETON_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [stateOverride, errorAttempt]);

  /* Surface the error toast as soon as the error state mounts.
     Retry resets the skeleton so the user sees a fresh attempt. */
  useEffect(() => {
    if (loadStage !== 'error') return;
    showToast({
      type: 'error',
      message: 'Failed to load templates. Try again.',
      duration: 6000,
      action: {
        label: 'Retry',
        onClick: () => setErrorAttempt((n) => n + 1),
      },
    });
  }, [loadStage, showToast]);

  /* Click outside to close dropdown */
  useEffect(() => {
    const handleClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* Close dropdown on Escape */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setSearchFocused(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  /* Clear any pending "create" timer on unmount so we don't fire toasts after
     the user has navigated away. */
  useEffect(() => () => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    if (createTimerRef.current) clearTimeout(createTimerRef.current);
  }, []);

  /* ── CTA banner handlers ──
     "Create Custom Form" → optimistic loading state → toast on resolve.
     We don't simulate failure here in the production flow; the error variant
     is still reachable via `?banner=error` for design review and via "Try
     again" inside the error state itself. */
  const handleBannerCreate = () => {
    if (bannerState === 'loading') return;
    setBannerState('loading');
    if (createTimerRef.current) clearTimeout(createTimerRef.current);
    createTimerRef.current = setTimeout(() => {
      createTimerRef.current = null;
      setBannerState('default');
      showToast({
        type: 'success',
        message: 'Blank form created in your workspace',
      });
    }, CREATE_LATENCY_MS);
  };

  const handleBannerRetry = () => {
    setBannerState('default');
    handleBannerCreate();
  };

  const handleBannerUpgrade = () => {
    showToast({
      type: 'info',
      message: 'Upgrade flow coming soon',
      duration: 2500,
    });
  };

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const clearSearch = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleRecentSearch = (term) => {
    setSearchQuery(term);
    inputRef.current?.focus();
  };

  /* "Use template" → flips the card into C4 (loading overlay) for ~1.6s then
     fires a success toast. Guarded so concurrent creates can't be triggered. */
  const handleUseTemplate = (template) => {
    if (loadingTemplateId) return;
    setLoadingTemplateId(template.id);
    loadingTimerRef.current = setTimeout(() => {
      setLoadingTemplateId(null);
      loadingTimerRef.current = null;
      showToast({
        type: 'success',
        message: `"${template.title}" form created`,
      });
    }, 1600);
  };

  /* "Preview" — placeholder until the template preview modal lands. */
  const handlePreview = (template) => {
    showToast({
      type: 'info',
      message: `Preview for "${template.title}" coming soon`,
      duration: 2500,
    });
  };

  /* Search-only matcher used inside the dropdown. The main grid is filtered
     independently via `activeFilter` so the page chrome stays stable while
     the user explores results in the dropdown. */
  const matchTemplates = (q) => {
    if (!q.trim()) return [];
    const needle = q.toLowerCase();
    return TEMPLATES.filter(
      (t) =>
        t.title.toLowerCase().includes(needle) ||
        t.tag.toLowerCase().includes(needle) ||
        t.filter.toLowerCase().includes(needle) ||
        t.description.toLowerCase().includes(needle)
    );
  };

  const filterByCategory = (templates) => {
    if (activeFilter === 'All') return templates;
    return templates.filter((t) => t.filter === activeFilter);
  };

  const isSearchActive = searchQuery.trim().length > 0;
  const dropdownOpen = searchFocused;
  const searchMatches = matchTemplates(searchQuery);
  const gridTemplates = filterByCategory(TEMPLATES);

  /* Keep the search bar visually "active" whenever it is focused OR has text. */
  const inputActive = searchFocused || isSearchActive;

  /* Decide which dropdown body to render. Order matters:
     1) Has query + matches → results
     2) Has query + 0 matches → no-results
     3) Empty query → recent searches */
  let dropdownState = null;
  if (dropdownOpen) {
    if (isSearchActive && searchMatches.length > 0) dropdownState = 'results';
    else if (isSearchActive && searchMatches.length === 0) dropdownState = 'empty';
    else dropdownState = 'recent';
  }

  /* Shared header used by empty/error states — matches Figma 1139:44777 / 1139:44871. */
  const renderHeader = () => (
    <div className="flex flex-col gap-[8px] mb-[16px]">
      <h1 className="text-[28px] font-semibold text-[#111110] leading-[42px] tracking-[-0.56px]">
        Form Templates
      </h1>
      <p className="text-[15px] font-normal text-[#656565] leading-[24px]">
        Choose from professionally designed templates optimized for high-quality responses and meaningful data collection.
      </p>
    </div>
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      {loadStage === 'full' && (
        <motion.div
          key="skeleton-full"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="w-full min-h-full"
        >
          <TemplatesSkeleton />
        </motion.div>
      )}

      {loadStage === 'partial' && (
        <motion.div
          key="skeleton-partial"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="w-full min-h-full"
        >
          <TemplatesPartialSkeleton />
        </motion.div>
      )}

      {/* ── Empty state — no templates available (Figma 1139:44774) ── */}
      {loadStage === 'empty' && (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22 }}
          className="w-full min-h-full"
        >
          <div className="bg-white min-h-full w-full">
            <div className="max-w-[1200px] w-full px-[32px] py-[32px]">
              {renderHeader()}
              <div className="flex flex-col gap-[12px] py-[12px]">
                <DisabledSearch />
                <EmptyTemplatesBody />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Error state — failed to load templates (Figma 1139:44868) ── */}
      {loadStage === 'error' && (
        <motion.div
          key="error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22 }}
          className="w-full min-h-full"
        >
          <div className="bg-white min-h-full w-full">
            <div className="max-w-[1200px] w-full px-[32px] py-[32px]">
              {renderHeader()}
              <div className="flex flex-col gap-[12px] py-[12px]">
                <DisabledSearch />
                <GreyedOutGrid />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {loadStage === 'loaded' && (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22 }}
          className="w-full min-h-full"
        >
          <div className="bg-white min-h-full w-full">
            <div className="max-w-[1200px] w-full px-[32px] py-[32px]">

              {/* ── Header ── */}
              <div className="flex flex-col gap-[8px] mb-[32px]">
                <h1 className="text-[28px] font-semibold text-[#111110] leading-[42px] tracking-[-0.56px]">
                  Form Templates
                </h1>
                <p className="text-[15px] font-normal text-[#656565] leading-[24px]">
                  Choose from professionally designed templates optimized for high-quality responses and meaningful data collection.
                </p>
              </div>

              {/* ── Search bar + Dropdown ── */}
              <div className="relative mb-[27px]" ref={searchContainerRef}>
                <div
                  className={`relative flex items-center rounded-[8px] transition-colors ${
                    inputActive
                      ? 'bg-white border border-[#1a1a1c]'
                      : 'bg-[#f7f6f3] border border-[#e8e7e2]'
                  }`}
                  style={
                    inputActive
                      ? { boxShadow: '0 0 0 3px rgba(0,0,0,0.12)' }
                      : undefined
                  }
                >
                  <div className="absolute left-[16px] top-1/2 -translate-y-1/2 pointer-events-none">
                    <RiSearchLine size={16} className={inputActive ? 'text-[#1a1a1c]' : 'text-[#aeada6]'} />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setSearchFocused(true)}
                    placeholder="Search templates by name, category, or use case..."
                    className="w-full bg-transparent pl-[48px] pr-[44px] py-[14px] text-[14px] font-normal text-[#1a1a1c] leading-[18px] outline-none placeholder:text-[#aeada6]"
                  />
                  <AnimatePresence>
                    {isSearchActive && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={clearSearch}
                        aria-label="Clear search"
                        className="absolute right-[12px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] flex items-center justify-center bg-[#e5e3dc] rounded-[9px] hover:bg-[#d4d2cb] transition-colors cursor-pointer"
                      >
                        <RiCloseLine size={12} className="text-[#1a1a1c]" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Unified search dropdown — Recent / Results / No results ── */}
                <AnimatePresence>
                  {dropdownState && (
                    <motion.div
                      key={dropdownState}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.14 }}
                      className="absolute top-[calc(100%+8px)] left-0 right-0 z-30 bg-white border border-[#e5e3dc] rounded-[8px] overflow-hidden"
                      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                    >
                      {/* ── Recent searches state ── */}
                      {dropdownState === 'recent' && (
                        <div className="py-[9px]">
                          <div className="px-[16px] pt-[8px] pb-[4px]">
                            <span className="text-[10px] font-bold text-[#a8a6a0] tracking-[0.6px] uppercase leading-[15px]">
                              Recent searches
                            </span>
                          </div>
                          {RECENT_SEARCHES.map((term) => (
                            <button
                              key={term}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleRecentSearch(term);
                              }}
                              className="w-full flex items-center gap-[6px] px-[16px] py-[8px] hover:bg-[#fafaf7] transition-colors cursor-pointer"
                            >
                              <RiTimeLine size={16} className="text-[#a8a6a0] shrink-0" />
                              <span className="text-[12px] font-normal text-[#6b6966] leading-[18px]">
                                {term}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* ── Results state ── */}
                      {dropdownState === 'results' && (
                        <>
                          <div className="px-[16px] pt-[12px] pb-[8px]">
                            <span className="text-[11px] font-normal text-[#6b6966] leading-[16.5px]">
                              {searchMatches.length} template{searchMatches.length !== 1 ? 's' : ''} found
                            </span>
                          </div>
                          <div className="border-t border-[#e5e3dc]">
                            {searchMatches.map((t, i) => (
                              <SearchResultRow
                                key={t.id}
                                template={t}
                                query={searchQuery}
                                onSelect={() => setSearchFocused(false)}
                                isLast={i === searchMatches.length - 1}
                              />
                            ))}
                          </div>
                        </>
                      )}

                      {/* ── No-results state ── */}
                      {dropdownState === 'empty' && (
                        <div className="flex flex-col">
                          <div className="flex flex-col items-center gap-[7px] px-[16px] pt-[32px] pb-[28px]">
                            <RiSearchLine size={16} className="text-[#1a1a1c]" />
                            <p className="text-[14px] font-medium text-[#1a1a1c] leading-[21px] text-center pt-[2px]">
                              No templates found for "{searchQuery}"
                            </p>
                            <p className="text-[12px] font-normal text-[#6b6966] leading-[19.2px] text-center">
                              Try a different term, or browse by category. You can also request a custom template.
                            </p>
                            <div className="flex flex-col items-center gap-[8px] pt-[13px]">
                              <button
                                type="button"
                                className="bg-[#1a1a1c] border border-[#1a1a1c] text-white text-[13px] font-medium leading-none h-[36px] px-[17px] rounded-[8px] hover:bg-[#2c2c2e] transition-colors cursor-pointer"
                              >
                                Create custom form
                              </button>
                              <p className="text-[12px] font-normal text-[#6b6966] leading-[18px] text-center">
                                or{' '}
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    clearSearch();
                                  }}
                                  className="text-[#1a1a1c] underline cursor-pointer hover:text-[#000]"
                                >
                                  clear search to browse all
                                </button>
                              </p>
                            </div>
                          </div>

                          {/* Did you mean strip */}
                          <div className="bg-[#f4f3ef] px-[16px] py-[12px] m-[5px] rounded-[8px]">
                            <p className="text-[11px] font-normal text-[#6b6966] leading-[16.5px] truncate">
                              Did you mean:{' '}
                              {DID_YOU_MEAN.map((term, i) => (
                                <span key={term}>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleRecentSearch(term);
                                    }}
                                    className="text-[11px] font-medium text-[#1a1a1c] hover:underline cursor-pointer"
                                  >
                                    {term}
                                  </button>
                                  {i < DID_YOU_MEAN.length - 1 && (
                                    <span className="mx-[6px]">·</span>
                                  )}
                                </span>
                              ))}
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Category Filters ── */}
              <div className="flex items-center gap-[4px] flex-wrap mb-[20px]">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={`h-[29px] flex items-center px-[9px] rounded-[999px] text-[10px] font-medium leading-[15px] cursor-pointer transition-colors whitespace-nowrap ${
                      activeFilter === tab
                        ? 'bg-[#1a1a1c] text-white border border-[#1a1a1c]'
                        : 'bg-white text-[#6b6966] border border-[#e5e3dc] hover:bg-[#f4f3ef]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* ── "Can't find what you need?" CTA banner — node 1139:45278 ── */}
              <div className="mb-[26px]">
                <CreateCustomFormBanner
                  state={resolvedBannerState}
                  planLimit={PLAN_LIMIT}
                  onCreate={handleBannerCreate}
                  onRetry={handleBannerRetry}
                  onUpgrade={handleBannerUpgrade}
                />
              </div>

              {/* ── Template Cards Grid ── */}
              {gridTemplates.length > 0 && (
                <div className="grid grid-cols-2 gap-[20px] items-start">
                  {gridTemplates.map((template, i) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <TemplateCard
                        template={template}
                        isLoading={loadingTemplateId === template.id}
                        anyLoading={loadingTemplateId !== null}
                        onUseTemplate={handleUseTemplate}
                        onPreview={handlePreview}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* ── Empty Category State ── */}
              {gridTemplates.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-[64px] gap-0"
                >
                  <div className="w-[48px] h-[48px] bg-[#f4f3ef] border border-[#e5e3dc] rounded-[12px] flex items-center justify-center mb-[16px]">
                    <RiFileAddLine size={16} className="text-[#a8a6a0]" />
                  </div>
                  <p className="text-[16px] font-medium text-[#1a1a1c] leading-[20.8px] mb-[4px]">
                    No templates in this category
                  </p>
                  <p className="text-[14px] font-normal text-[#6b6966] leading-[21px]">
                    Try another category or browse all templates.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TemplatesPage;
