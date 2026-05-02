import { useDispatch, useSelector } from 'react-redux';
import { setActiveWorkspace } from '../../redux/slices/formsSlice';

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)]';
const Sk = ({ className }) => <div className={`bg-[#ece9e3] ${shimmer} ${className}`} />;

const ALL_CHIP = { id: 'all', label: 'All workspaces', color: null, count: null };

const WorkspaceChips = () => {
  const dispatch = useDispatch();
  const { activeWorkspace, workspaces, isLoading } = useSelector((state) => state.forms);
  const chips = [ALL_CHIP, ...workspaces];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-6 py-3 flex-wrap">
        {[108, 84, 96, 78, 90].map((w, i) => (
          <Sk key={i} className="h-[28px] rounded-full" style={{ width: w }} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-6 py-3 flex-wrap">
      {chips.map((ws) => {
        const isActive = activeWorkspace === ws.id;
        return (
          <button
            key={ws.id}
            onClick={() => dispatch(setActiveWorkspace(ws.id))}
            className={`flex items-center gap-1 px-[11px] py-[5px] rounded-full text-[12px] font-semibold leading-[18px] transition-colors cursor-pointer border ${
              isActive
                ? 'bg-[#1a1a1c] text-white border-transparent'
                : 'bg-[#f4f3ef] text-[#6b6966] border-[#e5e3dc] hover:border-[#c9c7bf]'
            }`}
          >
            {ws.color && (
              <div
                className="w-[6px] h-[6px] rounded-[3px] shrink-0"
                style={{ backgroundColor: ws.color }}
              />
            )}
            <span>{ws.label}</span>
            {ws.count !== null && (
              <span className="opacity-60">{ws.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default WorkspaceChips;
