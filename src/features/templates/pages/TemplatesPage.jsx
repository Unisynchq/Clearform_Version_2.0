import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { RiSearchLine, RiCloseLine, RiTimeLine, RiNotification3Line } from 'react-icons/ri';
import {
  toggleNotificationCenter,
  closeStartWithTemplateModal,
  closeTemplatePreviewModal,
  openCreateNewFormModal,
  openStartWithTemplateModal,
  openTemplatePreviewModal,
} from '@/store/slices/uiSlice';
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
import { createFormFromUserTemplateAndOpenBuilder } from '@/features/forms/utils/createFormFromUserTemplateFlow';
import { DASHBOARD_CONTENT_MOTION } from '@/motion/dashboardMotion';
import StartWithTemplateModal from '../components/StartWithTemplateModal';
import OnboardingTemplatePreviewModal from '@/features/onboarding/components/OnboardingTemplatePreviewModal';
import { NO_WORKSPACE_ID } from '@/features/forms/constants/workspaces';

const PLAN_LIMIT = 10;
const PARTIAL_SKELETON_MS = 400;

const LibraryTab = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative h-11 px-3 text-[13px] font-medium cursor-pointer transition-colors duration-200 ${
      active ? 'text-[#1a1a1c]' : 'text-[#6b6966] hover:text-[#1a1a1c]'
    }`}
  >
    {active ? (
      <motion.span
        layoutId="templates-library-tab"
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="absolute inset-x-0 bottom-0 h-[2px] bg-[#1a1a1c]"
        aria-hidden
      />
    ) : null}
    <span className="relative z-10">{label}</span>
  </button>
);

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
  const navigate = useNavigate();
  const location = useLocation();
  const stateOverride = searchParams.get('state');
  const bannerOverride = searchParams.get('banner');
  const filterParam = searchParams.get('filter');

  const activeFilter =
    filterParam && TEMPLATE_FILTER_TABS.includes(filterParam) ? filterParam : 'All';

  const { templates, userTemplates, status, recentSearches, saveRecentSearch, reload, loadUserTemplates } =
    useTemplates({
    forceStatus:
      stateOverride === 'empty' ? 'empty' : stateOverride === 'error' ? 'error' : null,
  });

  const formsCount = useSelector((s) => s.forms.forms.length);
  const userEmail = useSelector((s) => s.auth.email);
  const unreadCount = useSelector((s) =>
    s.notifications.notifications.filter((item) => item.unread).length
  );
  const activeWorkspace = useSelector((s) => s.forms.activeWorkspace);
  const [showPartialSkeleton, setShowPartialSkeleton] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [loadingTemplateId, setLoadingTemplateId] = useState(null);
  const [bannerState, setBannerState] = useState('default');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [startModalTemplate, setStartModalTemplate] = useState(null);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [libraryTab, setLibraryTab] = useState(location.state?.libraryTab ?? 'all');
  const loadingTimerRef = useRef(null);
  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const { showToast } = useToast();
  const dispatch = useDispatch();

  useEffect(() => {
    if (location.state?.libraryTab) {
      setLibraryTab(location.state.libraryTab);
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location.pathname, location.search, location.state?.libraryTab, navigate]);

  useEffect(() => {
    loadUserTemplates();
  }, [loadUserTemplates]);

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
      dispatch(closeTemplatePreviewModal());
      dispatch(closeStartWithTemplateModal());
    },
    [dispatch]
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
    if (resolvedBannerState === 'loading' || resolvedBannerState === 'limit') return;
    dispatch(openCreateNewFormModal());
  };

  const handleBannerRetry = () => {
    setBannerState('default');
    dispatch(openCreateNewFormModal());
  };

  const handleBannerUpgrade = () => {
    showToast({ type: 'info', message: 'Upgrade flow coming soon', duration: 2500 });
  };

  const handleUseTemplate = (template) => {
    if (loadingTemplateId) return;
    flushSync(() => {
      dispatch(openStartWithTemplateModal());
    });
    setStartModalTemplate(template);
    setStartModalOpen(true);
  };

  const closeStartModal = () => {
    if (loadingTemplateId) return;
    setStartModalOpen(false);
    dispatch(closeStartWithTemplateModal());
  };

  const defaultStartWorkspaceId =
    activeWorkspace && activeWorkspace !== 'all' ? activeWorkspace : NO_WORKSPACE_ID;

  const handleCreateFromStartModal = async ({ formTitle, workspaceId }) => {
    if (!startModalTemplate || loadingTemplateId) return;
    const template = startModalTemplate;
    setLoadingTemplateId(template.id);
    try {
      if (template.isUserTemplate) {
        await createFormFromUserTemplateAndOpenBuilder({
          template,
          userEmail,
          activeWorkspace,
          workspaceId: workspaceId ?? undefined,
          formTitle,
          dispatch,
          navigate,
          showToast,
        });
      } else {
        await createFormFromTemplateAndOpenBuilder({
          template,
          activeWorkspace,
          workspaceId: workspaceId ?? undefined,
          formTitle,
          dispatch,
          navigate,
          showToast,
        });
      }
      setStartModalOpen(false);
      dispatch(closeStartWithTemplateModal());
    } catch {
      showToast({ type: 'error', message: 'Could not create form. Please try again.' });
    } finally {
      setLoadingTemplateId(null);
    }
  };

  const handlePreview = (template) => {
    flushSync(() => {
      dispatch(openTemplatePreviewModal());
    });
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    dispatch(closeTemplatePreviewModal());
  };

  const handleUseFromPreview = () => {
    if (!previewTemplate) return;
    const template = previewTemplate;
    closePreview();
    flushSync(() => {
      dispatch(openStartWithTemplateModal());
    });
    setStartModalTemplate(template);
    setStartModalOpen(true);
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
    <div className="flex min-h-full flex-1 w-full flex-col bg-white">
      {/* Figma top bar */}
      <div className="sticky top-0 z-20 shrink-0 bg-white border-b border-[#e5e3dc] h-[52px] flex items-center justify-between px-6">
        <h1 className="text-[20px] font-medium text-[#1a1a1c] tracking-[-0.2px] leading-[25px] whitespace-nowrap">
          {TEMPLATE_PAGE_COPY.title}
        </h1>

        <div className="relative w-[400px] max-w-[40vw]" ref={searchContainerRef}>
          <div
            className={`relative flex items-center rounded-[8px] transition-colors ${
              inputActive
                ? 'bg-white border border-[#1a1a1c] shadow-[0_0_0_3px_rgba(0,0,0,0.08)]'
                : 'bg-[#f4f3ef] border border-[#e5e3dc]'
            }`}
          >
            <div className="absolute left-[13px] top-1/2 -translate-y-1/2 pointer-events-none">
              <RiSearchLine size={14} className={inputActive ? 'text-[#1a1a1c]' : 'text-[#aeada6]'} />
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
              className="w-full bg-transparent pl-[34px] pr-10 py-[9px] text-[12.5px] text-[#1a1a1c] outline-none placeholder:text-[#aeada6]"
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
                        {didYouMean.map((term) => (
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

        <div className="relative p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => dispatch(toggleNotificationCenter())}
            className="flex size-8 items-center justify-center rounded-[6px] border border-[rgba(0,0,0,0.08)] bg-white transition-colors hover:bg-[#f4f3ef] cursor-pointer"
            aria-label="Toggle notifications"
          >
            <RiNotification3Line size={15} className="text-[#6b6966]" />
          </button>
          {unreadCount > 0 ? (
            <span className="absolute top-[5px] right-[5px] size-[6px] bg-[#d4522a] rounded-[3px] border border-[#f5f4f0]" />
          ) : null}
        </div>
      </div>

      <div className="max-w-[1200px] w-full px-8 py-4 mx-auto flex-1">{children}</div>
    </div>
  );

  const hero = (
    <div className="flex flex-col gap-1 py-4 mb-2">
      <h2 className="text-[30px] font-bold text-[#111110] leading-none tracking-[-0.6px]">
        {TEMPLATE_PAGE_COPY.heroTitle}
      </h2>
      <p className="text-[14px] font-normal text-[#6e6d67] leading-[22.4px]">
        {TEMPLATE_PAGE_COPY.heroSubtitle}
      </p>
    </div>
  );

  const libraryTabs = (
    <div className="border-b border-[#e5e3dc] mb-4">
      <div className="flex items-center gap-2">
        <LibraryTab
          label="All templates"
          active={libraryTab === 'all'}
          onClick={() => setLibraryTab('all')}
        />
        <LibraryTab
          label="My templates"
          active={libraryTab === 'mine'}
          onClick={() => setLibraryTab('mine')}
        />
      </div>
    </div>
  );

  const categoryFilters = (
    <div className="flex flex-wrap gap-1 mb-8">
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
  );

  const customFormBanner = (
    <div className="mb-6">
      <CreateCustomFormBanner
        state={resolvedBannerState}
        planLimit={PLAN_LIMIT}
        onCreate={handleBannerCreate}
        onRetry={handleBannerRetry}
        onUpgrade={handleBannerUpgrade}
      />
    </div>
  );

  const templateGrid = (
    <AnimatePresence mode="wait">
      <motion.div key={libraryTab} {...DASHBOARD_CONTENT_MOTION}>
        {libraryTab === 'mine' && userTemplates.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#e5e3dc] bg-[#fafaf7] px-6 py-14 text-center">
            <p className="text-[15px] font-medium text-[#1a1a1c] mb-2">No saved templates yet</p>
            <p className="text-[13px] text-[#6b6966]">
              Save a form as a template from the form builder to see it here.
            </p>
          </div>
        ) : null}

        {libraryTab === 'mine' && userTemplates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-8">
            {userTemplates.map((template, i) => (
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

        {libraryTab === 'all' && gridTemplates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-8">
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
        {libraryTab === 'all' && gridTemplates.length === 0 && status === 'loaded' && (
          <EmptyCategoryState />
        )}
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className="flex min-h-full flex-1 w-full flex-col bg-white">
      <AnimatePresence mode="wait">
      {loadStage === 'full' && (
        <motion.div key="full" exit={{ opacity: 0 }} className="flex min-h-full flex-1 flex-col bg-white">
          <TemplatesSkeleton />
        </motion.div>
      )}
      {loadStage === 'partial' && (
        <motion.div
          key="partial"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex min-h-full flex-1 flex-col bg-white"
        >
          <TemplatesPartialSkeleton />
        </motion.div>
      )}
      {loadStage === 'empty' &&
        pageShell(
          <>
            {hero}
            {customFormBanner}
            {libraryTabs}
            {categoryFilters}
            <DisabledSearch />
            <EmptyTemplatesBody />
          </>
        )}
      {loadStage === 'error' &&
        pageShell(
          <>
            {hero}
            {customFormBanner}
            {libraryTabs}
            {categoryFilters}
            <DisabledSearch />
            <GreyedOutGrid />
          </>
        )}
      {loadStage === 'loaded' &&
        pageShell(
          <>
            {hero}
            {customFormBanner}
            {libraryTabs}
            {categoryFilters}
            {templateGrid}
          </>
        )}
    </AnimatePresence>

    <OnboardingTemplatePreviewModal
      open={previewOpen}
      template={previewTemplate}
      onClose={closePreview}
      onUseTemplate={handleUseFromPreview}
      onExitComplete={() => setPreviewTemplate(null)}
    />

    <StartWithTemplateModal
      open={startModalOpen}
      template={startModalTemplate}
      defaultWorkspaceId={defaultStartWorkspaceId}
      creating={startModalOpen && loadingTemplateId === startModalTemplate?.id}
      onClose={closeStartModal}
      onCreate={handleCreateFromStartModal}
      onExitComplete={() => setStartModalTemplate(null)}
    />
    </div>
  );
};

export default TemplatesPage;
