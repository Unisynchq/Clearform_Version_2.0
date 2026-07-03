import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'motion/react';
import {
  RiArrowRightLine,
  RiArticleLine,
  RiCloseLine,
  RiInformationLine,
  RiLoader4Line,
  RiQuestionLine,
  RiTimeLine,
} from 'react-icons/ri';
import { selectNavWorkspaces } from '@/store/slices/formsSlice';
import { NO_WORKSPACE_ID } from '@/features/forms/constants/workspaces';
import { getTemplatePreviewBlocks } from '@/features/onboarding/utils/templatePreviewBlocks';
import { getUserTemplatePreviewBlocks } from '@/features/templates/utils/userTemplatePreview';
import WorkspaceFolderIcon from '@/components/ui/WorkspaceFolderIcon';
import {
  createFormModalTransition,
  modalEnter,
  modalExit,
  modalInitial,
} from '@/constants/premiumTransition';

const BACKDROP_KEY = 'start-template-backdrop';
const DIALOG_KEY = 'start-template-dialog';

const labelClass = 'block text-[12.5px] font-semibold text-[#7a7670] leading-[18px] mb-2';
const inputClass =
  'w-full rounded-[8px] border border-[#e4e0da] bg-[#fafaf8] px-[13px] py-[10px] text-[13px] text-[#1a1814] outline-none transition-colors placeholder:text-[rgba(26,24,20,0.5)] focus:border-[#1a1814] disabled:opacity-60';

const MetaPill = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center gap-[5px] rounded-full bg-[#f5f4f0] px-[10px] py-[4px] text-[11.5px] font-medium text-[#3a3835]">
    <Icon size={13} className="shrink-0 text-[#6b6760]" aria-hidden />
    {children}
  </span>
);

function WorkspaceSelect({ value, onChange, workspaces }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const options = useMemo(
    () => [
      { id: NO_WORKSPACE_ID, label: 'No workspace', color: null },
      ...workspaces.map((ws) => ({ id: ws.id, label: ws.label, color: ws.color })),
    ],
    [workspaces]
  );

  const selected = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-[40px] w-full items-center justify-between rounded-[8px] border border-[#e4e0da] bg-[#fafaf8] px-[13px] text-left cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2 text-[13px] text-[#1a1814]">
          {selected.color ? (
            <WorkspaceFolderIcon color={selected.color} open={open} size={16} />
          ) : null}
          <span className="truncate">{selected.label}</span>
        </span>
        <span
          className={`text-[#6b6760] transition-transform ${open ? 'rotate-90' : ''}`}
          aria-hidden
        >
          ›
        </span>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.25, 0.1, 0.25, 1] }}
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 max-h-[180px] overflow-y-auto rounded-[8px] border border-[#e8e6e1] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          >
            {options.map((opt) => (
              <li key={opt.id || 'none'} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={value === opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] cursor-pointer ${
                    value === opt.id
                      ? 'bg-[#f5f4f0] text-[#1a1a1c]'
                      : 'text-[#3a3835] hover:bg-[#fafaf8]'
                  }`}
                >
                  {opt.color ? <WorkspaceFolderIcon color={opt.color} size={16} /> : null}
                  {opt.label}
                </button>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function StartWithTemplateModal({
  open,
  template,
  defaultWorkspaceId,
  creating = false,
  onClose,
  onCreate,
  onExitComplete,
}) {
  const workspaces = useSelector(selectNavWorkspaces);
  const [formName, setFormName] = useState('');
  const [workspaceId, setWorkspaceId] = useState(defaultWorkspaceId ?? NO_WORKSPACE_ID);

  const { meta } = useMemo(() => {
    if (template?.isUserTemplate && template.snapshot) {
      return getUserTemplatePreviewBlocks(template.snapshot);
    }
    return getTemplatePreviewBlocks(template?.id);
  }, [template?.id, template?.isUserTemplate, template?.snapshot]);

  useEffect(() => {
    if (!open || !template) return;
    setFormName('');
    setWorkspaceId(defaultWorkspaceId ?? NO_WORKSPACE_ID);
  }, [open, template, defaultWorkspaceId]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === 'undefined') return null;

  const displayTitle = template?.title ?? '';
  const durationLabel = meta.duration.startsWith('~') ? meta.duration : `~${meta.duration}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!template) return;
    const trimmed = formName.trim();
    onCreate?.({
      formTitle: trimmed || displayTitle,
      workspaceId: workspaceId === NO_WORKSPACE_ID ? undefined : workspaceId,
    });
  };

  return createPortal(
    <AnimatePresence onExitComplete={onExitComplete}>
      {open && template ? (
        <>
          <motion.div
            key={BACKDROP_KEY}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={createFormModalTransition}
            onClick={creating ? undefined : onClose}
            className="fixed inset-0 z-[300] bg-black/20"
          />

          <div className="fixed inset-0 z-[301] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key={DIALOG_KEY}
              role="dialog"
              aria-modal="true"
              aria-labelledby="start-template-title"
              initial={modalInitial}
              animate={modalEnter}
              exit={modalExit}
              transition={createFormModalTransition}
              style={{ transformOrigin: 'center center' }}
              className="pointer-events-auto flex w-[min(100%,420px)] max-h-[min(88vh,540px)] flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_8px_48px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.08)]"
            >
            {/* Header */}
            <div className="shrink-0 border-b border-[#e8e6e1] px-6 pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 pr-6">
                  <h2
                    id="start-template-title"
                    className="text-[15px] font-semibold text-[#1a1814] tracking-[-0.2px] leading-[22.5px]"
                  >
                    Start with this template
                  </h2>
                  <p className="mt-1 text-[12.5px] font-normal text-[#7a7670] leading-[18px]">
                    A new form will be created based on &ldquo;{displayTitle}&rdquo;.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={creating}
                  className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#dedede] text-[#1a1814] hover:bg-[#d0d0d0] cursor-pointer disabled:opacity-50"
                  aria-label="Close dialog"
                >
                  <RiCloseLine size={14} />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <MetaPill icon={RiQuestionLine}>{meta.questionCount} questions</MetaPill>
                <MetaPill icon={RiTimeLine}>{durationLabel}</MetaPill>
                <MetaPill icon={RiArticleLine}>{meta.structure}</MetaPill>
              </div>
            </div>

            {/* Body */}
            <form
              id="start-template-form"
              onSubmit={handleSubmit}
              className="min-h-0 flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4"
            >
              <div>
                <label htmlFor="start-template-form-name" className={labelClass}>
                  New form Name
                </label>
                <input
                  id="start-template-form-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter name"
                  disabled={creating}
                  className={inputClass}
                />
                <p className="mt-1.5 text-[11.5px] text-[#9c9a94] leading-[17px]">
                  You can rename this anytime
                </p>
              </div>

              <div>
                <label className={labelClass}>Save to workspace</label>
                <WorkspaceSelect
                  value={workspaceId}
                  onChange={setWorkspaceId}
                  workspaces={workspaces}
                />
              </div>

              <div className="rounded-[10px] border border-[#e8e7e2] bg-[#f7f6f3] px-4 py-3.5 flex gap-2.5">
                <RiInformationLine size={16} className="shrink-0 text-[#656565] mt-0.5" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#1a1814] leading-[19px]">
                    Editing the new form won&apos;t change the template.
                  </p>
                  <p className="mt-1 text-[12px] font-normal text-[#7a7670] leading-[17px]">
                    The original &ldquo;{displayTitle}&rdquo; template stays unchanged and can be
                    reused anytime.
                  </p>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="shrink-0 border-t border-[#e8e6e1] px-6 py-3.5 flex justify-end bg-white">
              <button
                type="submit"
                form="start-template-form"
                disabled={creating}
                className="inline-flex items-center gap-1 bg-[#1a1814] text-white text-[12.5px] font-medium px-4 py-[9px] rounded-[8px] hover:bg-[#2c2c2c] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <RiLoader4Line size={14} className="animate-spin" aria-hidden />
                    Creating…
                  </>
                ) : (
                  <>
                    Create Form
                    <RiArrowRightLine size={14} aria-hidden />
                  </>
                )}
              </button>
            </div>
          </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
