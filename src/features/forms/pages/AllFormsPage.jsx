import { useEffect, useRef } from 'react';
import { useDashboardHydration } from '@/hooks/useDashboardHydration';
import {
  DASHBOARD_CONTENT_MOTION,
  DASHBOARD_HEADING_MOTION,
  DASHBOARD_LIST_MOTION,
  DASHBOARD_PAGE_EASE,
  DASHBOARD_SECTION_MOTION,
  dashboardGridItemTransition,
} from '@/motion/dashboardMotion';
import { useDispatch, useSelector } from 'react-redux';
import { openCreateNewFormModal } from '@/store/slices/uiSlice';
import { motion, AnimatePresence } from 'motion/react';
import { RiAddLine, RiLayoutGridLine } from 'react-icons/ri';
import {
  selectFilteredForms,
  setLoading,
  clearAllFormFilters,
} from '@/store/slices/formsSlice';
import FilterTabs from '../components/FilterTabs';
import WorkspaceChips from '../components/WorkspaceChips';
import TemplateBanner from '../components/TemplateBanner';
import FormCard from '../components/FormCard';
import FormListRow from '../components/FormListRow';
import { SkeletonGrid, SkeletonList } from '../components/SkeletonCard';
import Topbar from '@/components/layout/Topbar';
import ResponsesLimitBanner from '@/features/billing/components/ResponsesLimitBanner';
import NewWorkspaceEmpty from '../components/NewWorkspaceEmpty';
import { useToast } from '@/hooks/useToast';
import { dispatchSyncFormAlerts } from '@/utils/syncFormAlertsToStore';

/* ── Empty state: no forms from filter ── */
const FilterEmptyState = ({ hasFilters, onClearFilters, onNewForm }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 6 }}
    transition={{ duration: 0.3, ease: DASHBOARD_PAGE_EASE }}
    className="flex flex-col items-center justify-center py-16 gap-4"
  >
    <div className="w-14 h-14 bg-[#f4f3ef] border border-[#e5e3dc] rounded-[12px] flex items-center justify-center">
      <RiLayoutGridLine size={16} className="text-[#a8a6a0]" />
    </div>
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="text-[16px] font-medium text-[#1a1a1c] tracking-[-0.1px] leading-[20.8px]">
        No forms made
      </p>
      <p className="text-[14px] font-normal text-[#6b6966] leading-[21px]">
        Create your first form or start from a template.
      </p>
    </div>
    <div className="flex items-center gap-4">
      <button
        onClick={onNewForm}
        className="flex items-center gap-2 bg-[#1a1a1c] text-white text-[14px] font-medium px-[17px] py-[9px] rounded-lg hover:bg-[#2c2c2e] transition-colors cursor-pointer"
      >
        <RiAddLine size={14} />
        New Form
      </button>
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="bg-white border border-[#e5e3dc] text-[#1a1a1c] text-[14px] font-medium px-[17px] py-[9px] rounded-lg hover:bg-[#f4f3ef] transition-colors cursor-pointer"
        >
          Clear filters
        </button>
      )}
    </div>
  </motion.div>
);

/* ── List view table ── */
const ListView = ({ forms }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={DASHBOARD_LIST_MOTION.transition}
    className="bg-white border border-[#e5e3dc] rounded-[12px] overflow-hidden mt-4"
  >
    <div className="bg-[#f4f3ef] border-b border-[#e5e3dc] grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-4 px-4 py-2 items-center">
      {['FORM NAME', 'STATUS', 'RESPONSES', 'LAST UPDATED'].map((col) => (
        <span key={col} className="text-[10px] font-semibold text-[#a8a6a0] tracking-[0.6px] uppercase leading-[15px]">
          {col}
        </span>
      ))}
      <span />
    </div>
    {forms.map((form, index) => (
      <FormListRow key={form.id} form={form} index={index} />
    ))}
  </motion.div>
);

/* ── Grid view ── */
const GridView = ({ forms }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-4">
    {forms.map((form, index) => (
      <motion.div
        key={form.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={dashboardGridItemTransition(index)}
      >
        <FormCard form={form} />
      </motion.div>
    ))}
  </div>
);

/* ── Page ── */
const AllFormsPage = () => {
  const dispatch = useDispatch();
  const openNewFormModal = () => dispatch(openCreateNewFormModal());
  const { showToast } = useToast();
  const shownTargetToastIdsRef = useRef(new Set());
  const filteredForms = useSelector(selectFilteredForms);
  const {
    showTemplateBanner,
    viewMode,
    isLoading,
    activeFilter,
    activeWorkspace,
    searchQuery,
    forms: allForms,
    workspaces,
    advancedFilters,
  } = useSelector((s) => s.forms);

  const compareModeActive = useSelector((s) => s.ui.compareMode.active);

  const hasActiveFilters =
    activeFilter !== 'all' ||
    activeWorkspace !== 'all' ||
    searchQuery !== '' ||
    advancedFilters.status.length > 0 ||
    advancedFilters.responses.length > 0;
  const selectedWorkspaceForms = allForms.filter((f) => {
    if (activeWorkspace === 'all') return true;
    const fw = f.workspace == null || f.workspace === '' ? '' : String(f.workspace);
    return fw === String(activeWorkspace);
  });
  const isNewWorkspace = activeWorkspace !== 'all' && selectedWorkspaceForms.length === 0;

  const hydrationReady = useDashboardHydration();

  useEffect(() => {
    dispatch(setLoading(!hydrationReady));
  }, [hydrationReady, dispatch]);

  useEffect(() => {
    if (isLoading) return;
    allForms.forEach((f) => dispatchSyncFormAlerts(dispatch, f));
  }, [allForms, isLoading, dispatch]);

  useEffect(() => {
    if (isLoading) return;

    const reachedForm = allForms.find(
      (form) =>
        !!form.responseLimit
        && form.responses >= form.responseLimit
        && !shownTargetToastIdsRef.current.has(form.id)
    );

    if (!reachedForm) return;

    shownTargetToastIdsRef.current.add(reachedForm.id);
    showToast({
      type: 'success',
      message: `${reachedForm.title} - Response target achieved`,
      duration: 5000,
    });
  }, [allForms, isLoading, showToast]);

  const handleClearFilters = () => {
    dispatch(clearAllFormFilters());
  };

  /* Workspace name for new-workspace empty state — derived from Redux */
  const workspaceName =
    workspaces.find((ws) => ws.id === activeWorkspace)?.label ?? 'your workspace';

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden relative">
        <Topbar />
        <ResponsesLimitBanner />
        {/* Page heading + CTA */}
        <div className="flex items-end justify-between px-6 py-4">
          {isLoading ? (
            <>
              <div className="flex flex-col gap-[10px]">
                <div className="relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] h-[36px] w-[320px] bg-[#ece9e3] rounded-[8px]" />
                <div className="relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] h-[20px] w-[260px] bg-[#ece9e3] rounded-[6px]" />
              </div>
              <div className="relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] h-[38px] w-[104px] bg-[#ece9e3] rounded-[8px] shrink-0" />
            </>
          ) : (
            <motion.div
              key="page-heading-loaded"
              className="flex items-end justify-between w-full"
              initial={DASHBOARD_HEADING_MOTION.initial}
              animate={DASHBOARD_HEADING_MOTION.animate}
              transition={DASHBOARD_HEADING_MOTION.transition}
            >
              <div>
                <h2 className="text-[30px] font-semibold text-[#111110] leading-[36px] tracking-[-0.3px]">
                  What are you building today?
                </h2>
                <p className="text-[16px] font-normal text-[#6e6d67] leading-[24px]">
                  Start with a template or create a form from scratch
                </p>
              </div>
              <button
                type="button"
                onClick={openNewFormModal}
                className="flex items-center gap-2 bg-[#1a1a1c] text-white text-[14px] font-medium px-[17px] py-[9px] rounded-lg border border-[#1a1a1c] hover:bg-[#2c2c2e] transition-colors cursor-pointer shrink-0"
              >
                <RiAddLine size={14} />
                New Form
              </button>
            </motion.div>
          )}
        </div>

        {!isLoading ? (
          <motion.div
            key="dashboard-chrome"
            initial={DASHBOARD_SECTION_MOTION.initial}
            animate={DASHBOARD_SECTION_MOTION.animate}
            transition={{ ...DASHBOARD_SECTION_MOTION.transition, delay: 0.08 }}
          >
            <TemplateBanner visible={showTemplateBanner} isLoading={false} />
            <FilterTabs />
            <div className="px-6">
              <div className="h-px bg-[#e5e3dc]" />
            </div>
            <WorkspaceChips />
          </motion.div>
        ) : (
          <>
            <TemplateBanner visible={showTemplateBanner} isLoading />
            <FilterTabs />
            <div className="px-6">
              <div className="h-px bg-[#e5e3dc]" />
            </div>
            <WorkspaceChips />
          </>
        )}

        {/* Content area — extra bottom padding when compare dock is visible */}
        <div className={`flex-1 overflow-y-auto px-6 transition-all duration-300 ${compareModeActive ? 'pb-28' : 'pb-8'}`}>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.28, ease: DASHBOARD_PAGE_EASE } }}
              >
                {viewMode === 'grid' ? <SkeletonGrid count={6} /> : <SkeletonList count={6} />}
              </motion.div>
            ) : isNewWorkspace ? (
              <motion.div key="new-workspace" {...DASHBOARD_CONTENT_MOTION}>
                <NewWorkspaceEmpty workspaceName={workspaceName} />
              </motion.div>
            ) : filteredForms.length === 0 ? (
              <motion.div key="empty" {...DASHBOARD_CONTENT_MOTION}>
                <FilterEmptyState
                  hasFilters={hasActiveFilters}
                  onClearFilters={handleClearFilters}
                  onNewForm={openNewFormModal}
                />
              </motion.div>
            ) : viewMode === 'list' ? (
              <ListView key="list" forms={filteredForms} />
            ) : (
              <motion.div key="grid" {...DASHBOARD_CONTENT_MOTION}>
                <GridView forms={filteredForms} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default AllFormsPage;
