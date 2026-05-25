import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openCreateNewFormModal } from '@/store/slices/uiSlice';
import { motion, AnimatePresence } from 'motion/react';
import { RiAddLine, RiLayoutGridLine } from 'react-icons/ri';
import {
  selectFilteredForms,
  setLoading,
  setActiveFilter,
  setActiveWorkspace,
} from '@/store/slices/formsSlice';
import FilterTabs from '../components/FilterTabs';
import WorkspaceChips from '../components/WorkspaceChips';
import TemplateBanner from '../components/TemplateBanner';
import FormCard from '../components/FormCard';
import FormListRow from '../components/FormListRow';
import { SkeletonGrid, SkeletonList } from '../components/SkeletonCard';
import Topbar from '@/components/layout/Topbar';
import FormContextMenu from '../components/FormContextMenu';
import DeleteFormModal from '../components/DeleteFormModal';
import DuplicateFormModal from '../components/DuplicateFormModal';
import ArchiveFormModal from '../components/ArchiveFormModal';
import PauseFormModal from '../components/PauseFormModal';
import FormOverlayModal from '../components/FormOverlayModal';
import NewWorkspaceEmpty from '../components/NewWorkspaceEmpty';
import CreateWorkspaceModal from '../components/CreateWorkspaceModal';
import ShareFormModal from '../components/ShareFormModal';
import WorkspaceContextMenu from '../components/WorkspaceContextMenu';
import RenameWorkspaceModal from '../components/RenameWorkspaceModal';
import DeleteWorkspaceModal from '../components/DeleteWorkspaceModal';
import NotificationCenter from '../components/NotificationCenter';
import CompareModeDock from '../components/CompareModeDock';
import { useToast } from '@/hooks/useToast';

/* ── Empty state: no forms from filter ── */
const pageEase = [0.25, 0.1, 0.25, 1];

const FilterEmptyState = ({ hasFilters, onClearFilters, onNewForm }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 6 }}
    transition={{ duration: 0.22, ease: pageEase }}
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
    transition={{ duration: 0.2, ease: pageEase }}
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
        transition={{ duration: 0.2, delay: index * 0.04, ease: pageEase }}
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
  } = useSelector((s) => s.forms);

  const compareModeActive = useSelector((s) => s.ui.compareMode.active);

  const hasActiveFilters =
    activeFilter !== 'all' || activeWorkspace !== 'all' || searchQuery !== '';

  /* New workspace = a workspace is selected but has no forms at all */
  const selectedWorkspaceForms = allForms.filter(
    (f) => activeWorkspace === 'all' || f.workspace === activeWorkspace
  );
  const isNewWorkspace = activeWorkspace !== 'all' && selectedWorkspaceForms.length === 0;

  /* Simulate initial 1.2s data load */
  useEffect(() => {
    const t = setTimeout(() => dispatch(setLoading(false)), 1200);
    return () => clearTimeout(t);
  }, [dispatch]);

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
    dispatch(setActiveFilter('all'));
    dispatch(setActiveWorkspace('all'));
  };

  /* Workspace name for new-workspace empty state — derived from Redux */
  const workspaceName =
    workspaces.find((ws) => ws.id === activeWorkspace)?.label ?? 'your workspace';

  return (
    <>
      {/* ── Global overlay components ── */}
      <FormContextMenu />
      <DeleteFormModal />
      <DuplicateFormModal />
      <ArchiveFormModal />
      <PauseFormModal />
      <FormOverlayModal />
      <CreateWorkspaceModal />
      <ShareFormModal />
      <WorkspaceContextMenu />
      <RenameWorkspaceModal />
      <DeleteWorkspaceModal />
      <NotificationCenter />
      <CompareModeDock />
      <div className="flex flex-col h-full overflow-hidden relative">
        <Topbar />
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: pageEase, delay: 0.04 }}
            >
              <div>
                <h2 className="text-[30px] font-semibold text-[#111110] leading-[36px] tracking-[-0.3px]">
                  What are you building today?
                </h2>
                <p className="text-[16px] font-normal text-[#6e6d67] leading-[24px]">
                  Start with a template or create a form from scratch
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openNewFormModal}
                className="flex items-center gap-2 bg-[#1a1a1c] text-white text-[14px] font-medium px-[17px] py-[9px] rounded-lg border border-[#1a1a1c] hover:bg-[#2c2c2e] transition-colors cursor-pointer shrink-0"
              >
                <RiAddLine size={14} />
                New Form
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* Template banner */}
        <TemplateBanner visible={showTemplateBanner} isLoading={isLoading} />

        {/* Filter tabs + controls */}
        <FilterTabs />

        {/* Divider */}
        <div className="px-6">
          <div className="h-px bg-[#e5e3dc]" />
        </div>

        {/* Workspace chips */}
        <WorkspaceChips />

        {/* Content area — extra bottom padding when compare dock is visible */}
        <div className={`flex-1 overflow-y-auto px-6 transition-all duration-300 ${compareModeActive ? 'pb-28' : 'pb-8'}`}>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {viewMode === 'grid' ? <SkeletonGrid count={6} /> : <SkeletonList count={6} />}
              </motion.div>
            ) : isNewWorkspace ? (
              /* ── New workspace: never had any forms ── */
              <NewWorkspaceEmpty key="new-workspace" workspaceName={workspaceName} />
            ) : filteredForms.length === 0 ? (
              /* ── Filter returned nothing ── */
              <FilterEmptyState
                key="empty"
                hasFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
                onNewForm={openNewFormModal}
              />
            ) : viewMode === 'list' ? (
              <ListView key="list" forms={filteredForms} />
            ) : (
              <GridView key="grid" forms={filteredForms} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default AllFormsPage;
