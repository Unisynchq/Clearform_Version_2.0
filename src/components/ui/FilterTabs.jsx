import { useDispatch, useSelector } from 'react-redux';
import { RiFilter3Line, RiTimeLine, RiLayoutGridLine, RiMenuLine, RiSettings3Line } from 'react-icons/ri';
import { setActiveFilter, setViewMode } from '../../redux/slices/formsSlice';
import { openWorkspaceContextMenu } from '../../redux/slices/uiSlice';
import { FILTER_TABS } from '../../constants';

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)]';
const Sk = ({ className }) => <div className={`bg-[#ece9e3] ${shimmer} ${className}`} />;

const FilterTabs = () => {
  const dispatch = useDispatch();
  const { activeFilter, viewMode, isLoading, activeWorkspace } = useSelector((state) => state.forms);

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
              onClick={() => dispatch(setActiveFilter(tab.id))}
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
        <button className="flex items-center gap-1 bg-white border border-[#e5e3dc] rounded-lg px-[13px] py-[7px] hover:bg-[#f4f3ef] transition-colors cursor-pointer">
          <RiFilter3Line size={13} className="text-[#6b6966]" />
          <span className="text-[12px] font-medium text-[#6b6966] leading-normal">
            Filter
          </span>
        </button>

        <button className="flex items-center gap-1 bg-white border border-[#e5e3dc] rounded-lg px-[13px] py-[7px] hover:bg-[#f4f3ef] transition-colors cursor-pointer">
          <RiTimeLine size={13} className="text-[#6b6966]" />
          <span className="text-[12px] font-medium text-[#6b6966] leading-normal">
            Sort: Recent
          </span>
        </button>

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
