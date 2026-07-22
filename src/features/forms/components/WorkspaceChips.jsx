import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'motion/react';
import { setActiveWorkspace, selectNavWorkspaces } from '@/store/slices/formsSlice';

const chipEase = [0.25, 0.1, 0.25, 1];

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)]';
const Sk = ({ className }) => <div className={`bg-[#ece9e3] ${shimmer} ${className}`} />;

const ALL_CHIP = { id: 'all', label: 'All workspaces', color: null, count: null };

const WorkspaceChips = () => {
  const dispatch = useDispatch();
  const { activeWorkspace, isLoading } = useSelector((state) => state.forms);
  const workspaces = useSelector(selectNavWorkspaces);
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: chipEase }}
      className="flex items-center gap-2 px-6 py-3 flex-wrap"
    >
      {chips.map((ws, i) => {
        const isActive = activeWorkspace === ws.id;
        return (
          <motion.button
            key={ws.id}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04, ease: chipEase }}
            whileTap={{ scale: 0.97 }}
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
            {ws.count != null && ws.count > 0 && (
              <span className="opacity-60">{ws.count}</span>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
};

export default WorkspaceChips;
