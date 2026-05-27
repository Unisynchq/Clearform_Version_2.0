import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { RiAddLine, RiLayoutGridLine } from 'react-icons/ri';
import {
  selectFilteredForms,
  setLoading,
  setActiveFilter,
  setActiveWorkspace,
  fetchWorkspaces,
  fetchForms,
} from '../redux/slices/formsSlice';
import { openSearchPalette, openNewFormModal } from '../redux/slices/uiSlice';
import FilterTabs from '../components/ui/FilterTabs';
import WorkspaceChips from '../components/ui/WorkspaceChips';
import TemplateBanner from '../components/ui/TemplateBanner';
import FormCard from '../components/ui/FormCard';
import FormListRow from '../components/ui/FormListRow';
import { SkeletonGrid, SkeletonList } from '../components/ui/SkeletonCard';
import FormContextMenu from '../components/ui/FormContextMenu';
import DeleteFormModal from '../components/ui/DeleteFormModal';
import DuplicateFormModal from '../components/ui/DuplicateFormModal';
import ArchiveFormModal from '../components/ui/ArchiveFormModal';
import FormOverlayModal from '../components/ui/FormOverlayModal';
import NewWorkspaceEmpty from '../components/ui/NewWorkspaceEmpty';
import CreateWorkspaceModal from '../components/ui/CreateWorkspaceModal';
import ShareFormModal from '../components/ui/ShareFormModal';
import NewFormModal from '../components/ui/NewFormModal';

/* ── Empty state: no forms from filter ── */
const FilterEmptyState = ({ hasFilters, onClearFilters }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
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
      <button className="flex items-center gap-2 bg-[#1a1a1c] text-white text-[14px] font-medium px-[17px] py-[9px] rounded-lg hover:bg-[#2c2c2e] transition-colors cursor-pointer">
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
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
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
        transition={{ duration: 0.2, delay: index * 0.04 }}
      >
        <FormCard form={form} />
      </motion.div>
    ))}
  </div>
);

/* ── Page ── */
const AllFormsPage = () => {
  const dispatch = useDispatch();
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

  const hasActiveFilters =
    activeFilter !== 'all' || activeWorkspace !== 'all' || searchQuery !== '';

  /* New workspace = a workspace is selected but has no forms at all */
  const selectedWorkspaceForms = allForms.filter(
    (f) => activeWorkspace === 'all' || f.workspace === activeWorkspace
  );
  const isNewWorkspace = activeWorkspace !== 'all' && selectedWorkspaceForms.length === 0;

  /* Fetch real data */
  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchForms());
  }, [dispatch]);

  /* Global ⌘K listener */
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        dispatch(openSearchPalette());
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch]);

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
      <FormOverlayModal />
      <CreateWorkspaceModal />
      <ShareFormModal />
      <NewFormModal />
      <div className="flex flex-col h-full">
        {/* Page heading + CTA */}
        <div className="flex items-end justify-between px-6 py-4">
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
            onClick={() => dispatch(openNewFormModal())}
            className="flex items-center gap-2 bg-[#1a1a1c] text-white text-[14px] font-medium px-[17px] py-[9px] rounded-lg border border-[#1a1a1c] hover:bg-[#2c2c2e] transition-colors cursor-pointer shrink-0"
          >
            <RiAddLine size={14} />
            New Form
          </motion.button>
        </div>

        {/* Template banner */}
        <TemplateBanner visible={showTemplateBanner} />

        {/* Filter tabs + controls */}
        <FilterTabs />

        {/* Divider */}
        <div className="px-6">
          <div className="h-px bg-[#e5e3dc]" />
        </div>

        {/* Workspace chips */}
        <WorkspaceChips />

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-6 pb-8">
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
