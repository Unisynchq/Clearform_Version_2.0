import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'motion/react';
import { RiFilter3Line, RiLayoutGridLine, RiMenuLine, RiSettings3Line, RiArrowUpLine, RiArrowDownLine } from 'react-icons/ri';

const menuEase = [0.25, 0.1, 0.25, 1];

const SortIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M1.625 3.25H11.375M1.625 6.5H8.125M1.625 9.75H4.875" stroke="#6B6966" strokeWidth="0.975" strokeLinecap="round"/>
    <path d="M10.291 6.5L11.916 8.125L10.291 9.75" stroke="#6B6966" strokeWidth="0.975" strokeLinecap="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="9" height="7" viewBox="0 0 9 7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

import {
  setActiveFilter,
  setViewMode,
  setSortOrder,
  setAdvancedFilters,
  clearAdvancedFilters,
  clearAllFormFilters,
} from '@/store/slices/formsSlice';
import { openWorkspaceContextMenu } from '@/store/slices/uiSlice';
import { FILTER_TABS } from '@/constants';

const STATUS_OPTIONS = [
  { id: 'live',     label: 'Live',     dotColor: '#22c55e' },
  { id: 'draft',    label: 'Draft',    dotColor: '#a0a09c' },
  { id: 'archived', label: 'Archived', dotColor: '#d4d4d0' },
];

const RESPONSE_OPTIONS = [
  { id: 'has_responses', label: 'Has responses' },
  { id: 'no_responses',  label: 'No responses yet' },
];

const SORT_OPTIONS = [
  { id: 'recent',           label: 'Most recent',      subtitle: 'Last modified',  direction: 'newest' },
  { id: 'oldest',           label: 'Oldest first',     subtitle: 'Date created',   direction: 'oldest' },
  { id: 'name_az',          label: 'Name A → Z',       subtitle: 'Alphabetical',   direction: 'newest' },
  { id: 'name_za',          label: 'Name Z → A',       subtitle: 'Reverse alpha',  direction: 'oldest' },
  { id: 'most_responses',   label: 'Most responses',   subtitle: 'Highest count',  direction: 'newest' },
  { id: 'fewest_responses', label: 'Fewest responses', subtitle: 'Lowest count',   direction: 'oldest' },
];

const SORT_PAIRS = {
  recent:           { newest: 'recent',         oldest: 'oldest'           },
  oldest:           { newest: 'recent',         oldest: 'oldest'           },
  name_az:          { newest: 'name_az',        oldest: 'name_za'          },
  name_za:          { newest: 'name_az',        oldest: 'name_za'          },
  most_responses:   { newest: 'most_responses', oldest: 'fewest_responses' },
  fewest_responses: { newest: 'most_responses', oldest: 'fewest_responses' },
};

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)]';
const Sk = ({ className }) => <div className={`bg-[#ece9e3] ${shimmer} ${className}`} />;

const FilterTabs = () => {
  const dispatch = useDispatch();
  const { activeFilter, viewMode, isLoading, activeWorkspace, sortOrder, advancedFilters, forms } = useSelector((state) => state.forms);

  const [sortOpen, setSortOpen] = useState(false);
  const sortBtnRef = useRef(null);
  const sortMenuRef = useRef(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState([]);
  const [pendingResponses, setPendingResponses] = useState([]);
  const filterBtnRef = useRef(null);
  const filterMenuRef = useRef(null);

  const activeSortOption = SORT_OPTIONS.find((o) => o.id === sortOrder) ?? SORT_OPTIONS[0];
  const currentDirection = activeSortOption.direction;

  // Count of applied advanced filters for badge
  const appliedFilterCount = advancedFilters.status.length + advancedFilters.responses.length;

  // Counts for filter options (scoped to current workspace only)
  const workspaceForms = forms.filter((f) => activeWorkspace === 'all' || f.workspace === activeWorkspace);
  const filterCounts = {
    live:          workspaceForms.filter((f) => f.status === 'live').length,
    draft:         workspaceForms.filter((f) => f.status === 'draft').length,
    archived:      workspaceForms.filter((f) => f.status === 'archived').length,
    has_responses: workspaceForms.filter((f) => f.responses > 0).length,
    no_responses:  workspaceForms.filter((f) => f.responses === 0).length,
  };

  const handleFilterButtonClick = () => {
    if (!filterOpen) {
      setPendingStatus(advancedFilters.status);
      setPendingResponses(advancedFilters.responses);
    }
    setFilterOpen((v) => !v);
  };

  const togglePendingStatus = (id) => {
    setPendingStatus((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const togglePendingResponse = (id) => {
    setPendingResponses((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    dispatch(setAdvancedFilters({ status: pendingStatus, responses: pendingResponses }));
    setFilterOpen(false);
  };

  const handleClearAll = () => {
    setPendingStatus([]);
    setPendingResponses([]);
    dispatch(clearAdvancedFilters());
    setFilterOpen(false);
  };

  const handleTabClick = (tabId) => {
    if (tabId === 'all') {
      dispatch(clearAllFormFilters());
      setPendingStatus([]);
      setPendingResponses([]);
      return;
    }
    dispatch(setActiveFilter(tabId));
  };

  const pendingFilterCount = pendingStatus.length + pendingResponses.length;

  const handleSortButtonClick = () => setSortOpen((v) => !v);

  const handleSortSelect = (id) => {
    dispatch(setSortOrder(id));
    setSortOpen(false);
  };

  const handleOrderSelect = (direction) => {
    const newSortId = SORT_PAIRS[sortOrder]?.[direction];
    if (newSortId && newSortId !== sortOrder) {
      dispatch(setSortOrder(newSortId));
    }
  };

  // Close sort on outside click
  useEffect(() => {
    if (!sortOpen) return;
    const handleClickOutside = (e) => {
      if (
        !sortBtnRef.current?.contains(e.target) &&
        !sortMenuRef.current?.contains(e.target)
      ) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortOpen]);

  // Close filter panel on outside click
  useEffect(() => {
    if (!filterOpen) return;
    const handleClickOutside = (e) => {
      if (
        !filterBtnRef.current?.contains(e.target) &&
        !filterMenuRef.current?.contains(e.target)
      ) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  const handleSettingsClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    dispatch(openWorkspaceContextMenu({
      workspaceId: activeWorkspace,
      x: rect.left,
      y: rect.bottom + 4,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-between px-6">
        <div className="flex items-center gap-1 py-3">
          {[64, 52, 72, 58].map((w, i) => (
            <Sk key={i} className="h-[14px] rounded-[4px] mx-3" style={{ width: w }} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Sk className="h-[32px] w-[74px] rounded-[8px]" />
          <Sk className="h-[32px] w-[100px] rounded-[8px]" />
          <Sk className="h-[32px] w-[58px] rounded-[8px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-6">
      {/* Tabs */}
      <div className="flex items-center">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-4 py-3 text-[13px] font-medium leading-[19.5px] border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#1a1a1c] border-[#1a1a1c]'
                  : 'text-[#6b6966] border-transparent hover:text-[#1a1a1c]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Sort & view controls */}
      <div className="flex items-center gap-2">
        {/* Filter dropdown */}
        <div className="relative">
          <button
            ref={filterBtnRef}
            onClick={handleFilterButtonClick}
            className={`flex items-center gap-1 bg-white border rounded-lg px-[13px] py-[7px] transition-colors cursor-pointer ${
              filterOpen || appliedFilterCount > 0
                ? 'border-[#7c3aed] ring-1 ring-[#7c3aed]/30'
                : 'border-[#e5e3dc] hover:bg-[#f4f3ef]'
            }`}
          >
            <RiFilter3Line size={13} className={appliedFilterCount > 0 ? 'text-[#7c3aed]' : 'text-[#6b6966]'} />
            <span className={`text-[12px] font-medium leading-normal ${appliedFilterCount > 0 ? 'text-[#7c3aed]' : 'text-[#6b6966]'}`}>
              Filter{appliedFilterCount > 0 ? ` · ${appliedFilterCount}` : ''}
            </span>
          </button>

          <AnimatePresence>
            {filterOpen && (
            <motion.div
              ref={filterMenuRef}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.14, ease: menuEase }}
              className="absolute right-0 top-[calc(100%+6px)] z-50 bg-white border border-[#e5e5e2] rounded-[14px] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.08),0px_2px_6px_0px_rgba(0,0,0,0.04)] w-[260px] overflow-hidden outline-none origin-top-right"
            >
              {/* Header */}
              <div className="border-b border-[#e5e5e2] flex items-center justify-between px-[14px] pt-[12px] pb-[9px]">
                <span className="text-[11px] font-semibold text-[#a0a09c] tracking-[0.88px] uppercase leading-normal">
                  Filter
                </span>
                <button
                  onClick={handleClearAll}
                  className="text-[11.5px] font-medium text-[#6b6b68] leading-normal cursor-pointer hover:text-[#111110] transition-colors"
                >
                  Clear all
                </button>
              </div>

              {/* STATUS section */}
              <div className="border-b border-[#e5e5e2] pb-[5px] pt-[10px]">
                <div className="px-[14px] pb-[6px]">
                  <span className="text-[10px] font-semibold text-[#a0a09c] tracking-[0.8px] uppercase leading-normal">
                    Status
                  </span>
                </div>
                {STATUS_OPTIONS.map((opt) => {
                  const checked = pendingStatus.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => togglePendingStatus(opt.id)}
                      className="w-full flex items-center gap-[10px] px-[14px] py-[6px] cursor-pointer hover:bg-[#f4f3ef] transition-colors"
                    >
                      <div className={`shrink-0 size-[16px] rounded-[4.5px] border flex items-center justify-center transition-colors ${
                        checked ? 'bg-[#111110] border-[#111110]' : 'bg-white border-[#d4d4d0]'
                      }`}>
                        {checked && <CheckIcon />}
                      </div>
                      <div
                        className="shrink-0 size-[7px] rounded-[3.5px]"
                        style={{ backgroundColor: opt.dotColor }}
                      />
                      <span className="flex-1 min-w-0 text-[12.5px] font-medium text-[#111110] leading-normal text-left">
                        {opt.label}
                      </span>
                      <span className="shrink-0 text-[11px] font-normal text-[#a0a09c] leading-normal" style={{ fontFamily: 'DM Mono, monospace' }}>
                        {filterCounts[opt.id]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* RESPONSES section */}
              <div className="border-b border-[#e5e5e2] pb-[5px] pt-[10px]">
                <div className="px-[14px] pb-[6px]">
                  <span className="text-[10px] font-semibold text-[#a0a09c] tracking-[0.8px] uppercase leading-normal">
                    Responses
                  </span>
                </div>
                {RESPONSE_OPTIONS.map((opt) => {
                  const checked = pendingResponses.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => togglePendingResponse(opt.id)}
                      className="w-full flex items-center gap-[10px] px-[14px] py-[6px] cursor-pointer hover:bg-[#f4f3ef] transition-colors"
                    >
                      <div className={`shrink-0 size-[16px] rounded-[4.5px] border flex items-center justify-center transition-colors ${
                        checked ? 'bg-[#111110] border-[#111110]' : 'bg-white border-[#d4d4d0]'
                      }`}>
                        {checked && <CheckIcon />}
                      </div>
                      <span className="flex-1 min-w-0 text-[12.5px] font-medium text-[#111110] leading-normal text-left">
                        {opt.label}
                      </span>
                      <span className="shrink-0 text-[11px] font-normal text-[#a0a09c] leading-normal" style={{ fontFamily: 'DM Mono, monospace' }}>
                        {filterCounts[opt.id]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-[14px] pt-[11px] pb-[10px]">
                <span className="text-[11.5px] font-normal text-[#a0a09c] leading-normal">
                  {pendingFilterCount === 0
                    ? '0 filters applied'
                    : `${pendingFilterCount} filter${pendingFilterCount === 1 ? '' : 's'} applied`}
                </span>
                <button
                  onClick={handleApply}
                  className="bg-white border border-[#d4d4d0] rounded-[10px] px-[17px] py-[7px] text-[12px] font-semibold text-[#111110] leading-normal cursor-pointer hover:bg-[#f4f3ef] transition-colors"
                >
                  Apply
                </button>
              </div>
            </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            ref={sortBtnRef}
            onClick={handleSortButtonClick}
            className={`flex items-center gap-1 bg-white border rounded-lg px-[13px] py-[7px] transition-colors cursor-pointer ${
              sortOpen ? 'border-[#7c3aed] ring-1 ring-[#7c3aed]/30' : 'border-[#e5e3dc] hover:bg-[#f4f3ef]'
            }`}
          >
            <SortIcon />
            <span className="text-[12px] font-medium text-[#6b6966] leading-normal">
              Sort: {activeSortOption.label}
            </span>
          </button>

          <AnimatePresence>
            {sortOpen && (
            <motion.div
              ref={sortMenuRef}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.14, ease: menuEase }}
              className="absolute right-0 top-[calc(100%+6px)] z-50 bg-white border border-[#e5e5e2] rounded-[14px] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.08),0px_2px_6px_0px_rgba(0,0,0,0.04)] min-w-[240px] overflow-hidden outline-none origin-top-right"
            >
              {/* SORT BY header */}
              <div className="border-b border-[#e5e5e2] px-[14px] pt-[12px] pb-[9px]">
                <span className="text-[11px] font-semibold text-[#a0a09c] tracking-[0.88px] uppercase leading-normal">
                  Sort by
                </span>
              </div>

              {/* Options */}
              <div className="py-[6px]">
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sortOrder === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSortSelect(opt.id)}
                      className={`w-full flex items-center gap-[10px] px-[14px] py-[7px] transition-colors cursor-pointer text-left ${
                        isSelected ? 'bg-[#ebebea]' : 'hover:bg-[#f4f3ef]'
                      }`}
                    >
                      <div className={`shrink-0 size-[15px] rounded-full border flex items-center justify-center ${
                        isSelected ? 'bg-[#6b6b68] border-[#6b6b68]' : 'bg-white border-[#d4d4d0]'
                      }`}>
                        {isSelected && <div className="size-[5px] rounded-full bg-white" />}
                      </div>
                      <span className="flex-1 min-w-0 text-[12.5px] font-medium text-[#111110] leading-normal">
                        {opt.label}
                      </span>
                      <span className="shrink-0 text-[11px] font-normal text-[#a0a09c] leading-normal">
                        {opt.subtitle}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ORDER section */}
              <div className="border-t border-[#e5e5e2] px-[14px] pt-[9px] pb-[10px] flex items-center gap-[6px]">
                <span className="flex-1 text-[11px] font-semibold text-[#a0a09c] tracking-[0.77px] uppercase leading-normal">
                  Order
                </span>
                <div className="flex border border-[#e5e5e2] rounded-[6px] overflow-hidden p-px gap-0">
                  <button
                    onClick={() => handleOrderSelect('newest')}
                    className={`flex items-center gap-[5px] px-[10px] py-[5px] text-[11.5px] font-semibold leading-normal transition-colors cursor-pointer ${
                      currentDirection === 'newest' ? 'bg-[#ebebea] text-[#111110]' : 'text-[#6b6b68] hover:bg-[#f4f3ef]'
                    }`}
                  >
                    <RiArrowUpLine size={11} />
                    Newest
                  </button>
                  <button
                    onClick={() => handleOrderSelect('oldest')}
                    className={`flex items-center gap-[5px] px-[10px] py-[5px] text-[11.5px] leading-normal transition-colors cursor-pointer border-l border-[#e5e5e2] ${
                      currentDirection === 'oldest'
                        ? 'bg-[#ebebea] text-[#111110] font-semibold'
                        : 'text-[#6b6b68] font-medium hover:bg-[#f4f3ef]'
                    }`}
                  >
                    <RiArrowDownLine size={11} />
                    Oldest
                  </button>
                </div>
              </div>
            </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* View toggle */}
        <div className="flex items-start border border-[#e5e3dc] rounded-lg overflow-hidden p-px">
          <button
            onClick={() => dispatch(setViewMode('grid'))}
            className={`flex items-center justify-center px-[9px] py-[6px] border-r border-[#e5e3dc] cursor-pointer transition-colors ${
              viewMode === 'grid' ? 'bg-[#f4f3ef]' : 'bg-white hover:bg-[#f4f3ef]'
            }`}
          >
            <RiLayoutGridLine size={14} className="text-[#6b6966]" />
          </button>
          <button
            onClick={() => dispatch(setViewMode('list'))}
            className={`flex items-center justify-center px-[9px] py-[6px] cursor-pointer transition-colors ${
              viewMode === 'list' ? 'bg-[#f4f3ef]' : 'bg-white hover:bg-[#f4f3ef]'
            }`}
          >
            <RiMenuLine size={14} className="text-[#6b6966]" />
          </button>
        </div>

        {/* Workspace settings — only visible when a specific workspace is selected */}
        {activeWorkspace !== 'all' && (
          <button
            onClick={handleSettingsClick}
            className="flex items-center justify-center w-[32px] h-[32px] bg-white border border-[#e5e3dc] rounded-lg hover:bg-[#f4f3ef] transition-colors cursor-pointer"
            title="Workspace settings"
          >
            <RiSettings3Line size={14} className="text-[#6b6966]" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterTabs;
