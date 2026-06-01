import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { RiSearchLine, RiCloseLine, RiTimeLine } from 'react-icons/ri';
import TemplatesSkeleton from '../components/TemplatesSkeleton';
import TemplatesPartialSkeleton from '../components/TemplatesPartialSkeleton';
import CreateCustomFormBanner from '../components/CreateCustomFormBanner';
import TemplateCard from '../components/TemplateCard';
import {
  DisabledSearch,
  GreyedOutGrid,
  EmptyTemplatesBody,
  EmptyCategoryState,
} from '../components/TemplatesPageStates';
import { useTemplates } from '../hooks/useTemplates';
import { TEMPLATE_FILTER_TABS, TEMPLATE_PAGE_COPY } from '../constants';
import {
  filterTemplatesByCategory,
  searchTemplates,
  suggestTemplateSearchTerms,
} from '../utils/templateFilters';
import { useToast } from '@/hooks/useToast';
import { createFormFromTemplateAndOpenBuilder } from '@/features/forms/utils/createFormFromTemplateFlow';
import OnboardingTemplatePreviewModal from '@/features/onboarding/components/OnboardingTemplatePreviewModal';

const PLAN_LIMIT = 10;
const CREATE_LATENCY_MS = 1600;
const PARTIAL_SKELETON_MS = 400;

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

const SearchResultRow = ({ template, query, onSelect, isLast }) => {
  const { Icon } = template;
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
      className={`w-full bg-white text-left flex gap-3 items-start px-4 pt-3 pb-[13px] hover:bg-[#fafaf7] transition-colors cursor-pointer ${
        isLast ? '' : 'border-b border-[#e5e3dc]'
      }`}
    >
      <motion.div layout className="w-8 h-8 shrink-0 bg-[#f4f3ef] border border-[#e5e3dc] rounded-lg flex items-center justify-center">
        <Icon size={16} className="text-[#6b6966]" />
      </motion.div>
      <div className="flex flex-col gap-[3px] items-start flex-1 min-w-0">
        <span className="text-[12px] font-semibold text-[#1a1a1c] leading-[18px] truncate w-full">
          <Highlight text={template.title} query={query} />
        </span>
        <span className="text-[11px] font-normal text-[#6b6966] leading-[16.5px] truncate w-full pb-0.5">
          {shortDesc}
        </span>
        <span className="inline-flex items-center border border-[#a0a0a0] rounded-[3px] px-[7px] pt-px pb-0.5 text-[9px] font-bold text-[#1a1a1c] uppercase leading-[13.5px] tracking-[0.3px] whitespace-nowrap">
          <Highlight text={template.category} query={query} />
        </span>
      </div>
    </button>
  );
};

const TemplatesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const stateOverride = searchParams.get('state');
  const bannerOverride = searchParams.get('banner');
  const filterParam = searchParams.get('filter');

  const activeFilter =
    filterParam && TEMPLATE_FILTER_TABS.includes(filterParam) ? filterParam : 'All';

  const { templates, status, recentSearches, saveRecentSearch, reload } = useTemplates({
    forceStatus:
      stateOverride === 'empty' ? 'empty' : stateOverride === 'error' ? 'error' : null,
  });

  const formsCount = useSelector((s) => s.forms.forms.length);
  const activeWorkspace = useSelector((s) => s.forms.activeWorkspace);
  const [showPartialSkeleton, setShowPartialSkeleton] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [loadingTemplateId, setLoadingTemplateId] = useState(null);
  const [bannerState, setBannerState] = useState('default');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const createTimerRef = useRef(null);
  const loadingTimerRef = useRef(null);
  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const { showToast } = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isAtLimit = formsCount >= PLAN_LIMIT;
  const resolvedBannerState =
    bannerOverride && ['default', 'loading', 'error', 'limit'].includes(bannerOverride)
      ? bannerOverride
      : bannerState === 'loading' || bannerState === 'error'
        ? bannerState
        : isAtLimit
          ? 'limit'
          : 'default';

  useEffect(() => {
    if (stateOverride || status !== 'loading') {
      setShowPartialSkeleton(false);
      return undefined;
    }
    const t = setTimeout(() => setShowPartialSkeleton(true), PARTIAL_SKELETON_MS);
    return () => clearTimeout(t);
  }, [stateOverride, status]);

  useEffect(() => {
    if (status !== 'error') return;
    showToast({
      type: 'error',
      message: 'Failed to load templates. Try again.',
      duration: 6000,
      action: { label: 'Retry', onClick: reload },
    });
  }, [status, showToast, reload]);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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

  useEffect(
    () => () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      if (createTimerRef.current) clearTimeout(createTimerRef.current);
    },
    []
  );

  const selectFilterTab = (tab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tab === 'All') next.delete('filter');
        else next.set('filter', tab);
        return next;
      },
      { replace: true }
    );
  };

  const handleBannerCreate = () => {
    if (bannerState === 'loading') return;
    setBannerState('loading');
    if (createTimerRef.current) clearTimeout(createTimerRef.current);
    createTimerRef.current = setTimeout(() => {
      createTimerRef.current = null;
      setBannerState('default');
      showToast({ type: 'success', message: 'Blank form created in your workspace' });
    }, CREATE_LATENCY_MS);
  };

  const handleBannerRetry = () => {
    setBannerState('default');
    handleBannerCreate();
  };

  const handleBannerUpgrade = () => {
    showToast({ type: 'info', message: 'Upgrade flow coming soon', duration: 2500 });
  };

  const handleUseTemplate = async (template) => {
    if (loadingTemplateId) return;
    setLoadingTemplateId(template.id);
    try {
      await createFormFromTemplateAndOpenBuilder({
        template,
        activeWorkspace,
        dispatch,
        navigate,
        showToast,
      });
    } catch {
      showToast({ type: 'error', message: 'Could not create form. Please try again.' });
    } finally {
      setLoadingTemplateId(null);
    }
  };

  const previewOpen = previewTemplate !== null;

  const handlePreview = (template) => {
    setPreviewTemplate(template);
  };

  const closePreview = () => {
    setPreviewTemplate(null);
  };

  const handleUseFromPreview = () => {
    if (!previewTemplate) return;
    const template = previewTemplate;
    closePreview();
    handleUseTemplate(template);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) saveRecentSearch(searchQuery);
  };

  const searchMatches = useMemo(
    () => searchTemplates(templates, searchQuery),
    [templates, searchQuery]
  );
  const gridTemplates = useMemo(
    () => filterTemplatesByCategory(templates, activeFilter),
    [templates, activeFilter]
  );
  const didYouMean = useMemo(
    () => suggestTemplateSearchTerms(templates, searchQuery),
    [templates, searchQuery]
  );

  const isSearchActive = searchQuery.trim().length > 0;
  const inputActive = searchFocused || isSearchActive;

  let dropdownState = null;
  if (searchFocused) {
    if (isSearchActive && searchMatches.length > 0) dropdownState = 'results';
    else if (isSearchActive && searchMatches.length === 0) dropdownState = 'empty';
    else dropdownState = 'recent';
  }

  const loadStage =
    status === 'loading' ? (showPartialSkeleton ? 'partial' : 'full') : status;

  const pageShell = (children) => (
    <div className="bg-white min-h-full w-full">
      <div className="max-w-[1200px] w-full px-8 py-8">{children}</div>
    </div>
  );

  const header = (
    <div className="flex flex-col gap-2 mb-8">
      <h1 className="text-[28px] font-semibold text-[#111110] leading-[42px] tracking-[-0.56px]">
        {TEMPLATE_PAGE_COPY.title}
      </h1>
      <p className="text-[15px] font-normal text-[#656565] leading-6">
        {TEMPLATE_PAGE_COPY.subtitle}
      </p>
    </div>
  );

  const searchAndFilters = (
    <>
      <div className="relative mb-[27px]" ref={searchContainerRef}>
        <div
          className={`relative flex items-center rounded-lg transition-colors ${
            inputActive ? 'bg-white border border-[#1a1a1c]' : 'bg-[#f7f6f3] border border-[#e8e7e2]'
          }`}
          style={inputActive ? { boxShadow: '0 0 0 3px rgba(0,0,0,0.12)' } : undefined}
        >
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <RiSearchLine size={16} className={inputActive ? 'text-[#1a1a1c]' : 'text-[#aeada6]'} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
            onBlur={handleSearchSubmit}
            placeholder={TEMPLATE_PAGE_COPY.searchPlaceholder}
            className="w-full bg-transparent pl-12 pr-11 py-[14px] text-[14px] text-[#1a1a1c] outline-none placeholder:text-[#aeada6]"
          />
          {isSearchActive && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] flex items-center justify-center bg-[#e5e3dc] rounded-full cursor-pointer"
            >
              <RiCloseLine size={12} />
            </button>
          )}
        </div>

        <AnimatePresence>
          {dropdownState && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-[calc(100%+8px)] left-0 right-0 z-30 bg-white border border-[#e5e3dc] rounded-lg overflow-hidden shadow-lg"
            >
              {dropdownState === 'recent' && (
                <div className="py-2">
                  <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-[#a8a6a0] uppercase tracking-wider">
                    Recent searches
                  </p>
                  {recentSearches.length === 0 ? (
                    <p className="px-4 py-3 text-[12px] text-[#a8a6a0]">No recent searches yet</p>
                  ) : (
                    recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSearchQuery(term);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#fafaf7] cursor-pointer"
                      >
                        <RiTimeLine size={16} className="text-[#a8a6a0]" />
                        <span className="text-[12px] text-[#6b6966]">{term}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {dropdownState === 'results' && (
                <div>
                  <p className="px-4 pt-3 pb-2 text-[11px] text-[#6b6966]">
                    {searchMatches.length} template{searchMatches.length !== 1 ? 's' : ''} found
                  </p>
                  <motion.div layout className="border-t border-[#e5e3dc]">
                    {searchMatches.map((t, i) => (
                      <SearchResultRow
                        key={t.id}
                        template={t}
                        query={searchQuery}
                        onSelect={() => setSearchFocused(false)}
                        isLast={i === searchMatches.length - 1}
                      />
                    ))}
                  </motion.div>
                </div>
              )}

              {dropdownState === 'empty' && (
                <div className="px-4 py-8 text-center">
                  <p className="text-[14px] font-medium text-[#1a1a1c] mb-2">
                    No templates found for &quot;{searchQuery}&quot;
                  </p>
                  <p className="text-[12px] text-[#6b6966] mb-4">
                    Try a different term, or browse by category.
                  </p>
                  {didYouMean.length > 0 && (
                    <p className="text-[11px] text-[#6b6966]">
                      Did you mean:{' '}
                      {didYouMean.map((term, i) => (
                        <button
                          key={term}
                          type="button"
                          className="font-medium text-[#1a1a1c] underline mx-1"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchQuery(term);
                          }}
                        >
                          {term}
                        </button>
                      ))}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-1 mb-5">
        {TEMPLATE_FILTER_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => selectFilterTab(tab)}
            className={`h-[29px] px-[9px] rounded-full text-[10px] font-medium cursor-pointer ${
              activeFilter === tab
                ? 'bg-[#1a1a1c] text-white border border-[#1a1a1c]'
                : 'bg-white text-[#6b6966] border border-[#e5e3dc] hover:bg-[#f4f3ef]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mb-[26px]">
        <CreateCustomFormBanner
          state={resolvedBannerState}
          planLimit={PLAN_LIMIT}
          onCreate={handleBannerCreate}
          onRetry={handleBannerRetry}
          onUpgrade={handleBannerUpgrade}
        />
      </div>
    </>
  );

  const templateGrid = (
    <>
      {gridTemplates.length > 0 && (
        <div className="grid grid-cols-2 gap-5">
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
      {gridTemplates.length === 0 && status === 'loaded' && <EmptyCategoryState />}
    </>
  );

  return (
    <>
    <AnimatePresence mode="wait">
      {loadStage === 'full' && (
        <motion.div key="full" exit={{ opacity: 0 }}>
          <TemplatesSkeleton />
        </motion.div>
      )}
      {loadStage === 'partial' && (
        <motion.div key="partial" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <TemplatesPartialSkeleton />
        </motion.div>
      )}
      {loadStage === 'empty' &&
        pageShell(
          <>
            {header}
            <DisabledSearch />
            <EmptyTemplatesBody />
          </>
        )}
      {loadStage === 'error' &&
        pageShell(
          <>
            {header}
            <DisabledSearch />
            <GreyedOutGrid />
          </>
        )}
      {loadStage === 'loaded' &&
        pageShell(
          <>
            {header}
            {searchAndFilters}
            {templateGrid}
          </>
        )}
    </AnimatePresence>

    <OnboardingTemplatePreviewModal
      open={previewOpen}
      template={previewTemplate}
      onClose={closePreview}
      onUseTemplate={handleUseFromPreview}
    />
    </>
  );
};

export default TemplatesPage;
