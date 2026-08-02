import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'motion/react';
import { RiMoreFill } from 'react-icons/ri';
import WorkspaceFolderIcon from '@/components/ui/WorkspaceFolderIcon';
import Tooltip from '@/components/ui/Tooltip';
import { useIsTruncated } from '@/hooks/useIsTruncated';
import { renameWorkspace } from '@/store/slices/formsSlice';
import { clearSidebarWorkspaceRename } from '@/store/slices/uiSlice';
import { updateWorkspace } from '@/api/services/workspacesService';
import { isApiConfigured } from '@/config/env';
import { useToast } from '@/hooks/useToast';

export default function WorkspaceSidebarItem({
  workspace,
  active,
  frozen,
  isRenaming,
  onSelect,
  onStartRename,
  onContextMenu,
}) {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const color = workspace.color || '#6b6966';
  const labelRef = useRef(null);
  const inputRef = useRef(null);
  const isTruncated = useIsTruncated(labelRef, [workspace.label, isRenaming]);
  const [draftName, setDraftName] = useState(workspace.label);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isRenaming) {
      const raf = window.requestAnimationFrame(() => {
        setDraftName(workspace.label);
        inputRef.current?.select();
      });
      return () => window.cancelAnimationFrame(raf);
    }
  }, [isRenaming, workspace.label]);

  const cancelRename = () => {
    setDraftName(workspace.label);
    dispatch(clearSidebarWorkspaceRename());
  };

  const commitRename = async () => {
    const trimmed = draftName.trim();
    if (!trimmed || saving) {
      cancelRename();
      return;
    }
    if (trimmed === workspace.label) {
      cancelRename();
      return;
    }

    setSaving(true);
    try {
      if (isApiConfigured()) {
        await updateWorkspace(workspace.id, { label: trimmed });
      }
      dispatch(renameWorkspace({ workspaceId: workspace.id, newName: trimmed }));
      dispatch(clearSidebarWorkspaceRename());
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message ?? 'Could not rename workspace.',
        duration: 6000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClick = () => {
    if (isRenaming) return;
    onSelect();
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onStartRename();
  };

  const frozenHint =
    'Over your plan’s workspace limit — existing forms keep working, upgrade to add new ones here.';

  return (
    <motion.div
      role="button"
      tabIndex={isRenaming ? -1 : 0}
      whileHover={isRenaming ? undefined : { backgroundColor: active ? `${color}2E` : `${color}14` }}
      animate={{ backgroundColor: active ? `${color}1F` : 'transparent' }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={onContextMenu}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      title={frozen ? frozenHint : undefined}
      className="group flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg px-4 py-2 text-left transition-colors cursor-pointer"
    >
      <WorkspaceFolderIcon color={color} open={active} size={18} className="shrink-0" />
      {isRenaming ? (
        <input
          ref={inputRef}
          type="text"
          value={draftName}
          disabled={saving}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={() => void commitRename()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void commitRename();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              cancelRename();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="min-w-0 flex-1 rounded-[6px] border border-[#1a1a1c] bg-white px-2 py-[2px] text-left text-[13px] font-medium leading-[19.5px] text-[#1a1a1c] outline-none ring-1 ring-[#1a1a1c]/10"
          aria-label="Rename workspace"
        />
      ) : (
        <Tooltip content={isTruncated ? workspace.label : null} disabled={!isTruncated}>
          <span
            ref={labelRef}
            className={`block min-w-0 flex-1 truncate text-left text-[13px] font-medium leading-[19.5px] ${
              active ? 'text-[#1a1a1c]' : 'text-[#6b6966]'
            }`}
          >
            {workspace.label}
          </span>
        </Tooltip>
      )}
      {!isRenaming && frozen ? (
        <span className="shrink-0 rounded-full bg-[#f4ede2] px-[7px] py-[1px] text-[10px] font-semibold uppercase tracking-[0.4px] text-[#a3702a]">
          Limit
        </span>
      ) : null}
      {!isRenaming ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onContextMenu(e);
          }}
          className={`shrink-0 flex items-center justify-center rounded-[6px] w-[22px] h-[22px] hover:bg-black/10 transition-colors ${
            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          aria-label="Manage workspace"
        >
          <RiMoreFill size={16} className={active ? 'text-[#1a1a1c]' : 'text-[#6b6966]'} />
        </button>
      ) : null}
    </motion.div>
  );
}
