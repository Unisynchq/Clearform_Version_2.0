import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { RiArrowDownSLine, RiArrowRightSLine, RiCloseLine } from 'react-icons/ri';
import {
  closeCreateNewFormModal,
  startBuilderRouteTransition,
} from '@/store/slices/uiSlice';
import { createFormThunk, selectNavWorkspaces } from '@/store/slices/formsSlice';
import { completeOnboarding, selectIsOnboardingActive } from '@/store/slices/onboardingSlice';
import { NO_WORKSPACE_ID } from '../constants/workspaces';
import { FORM_COLOR_OPTIONS, getFormColorTheme } from '../constants/formColorThemes';
import { navigateToFormBuilder } from '../utils/navigateToFormBuilder';
import {
  createFormModalTransition,
  logModalLifecycle,
  modalEnter,
  modalExit,
  modalInitial,
} from '@/constants/premiumTransition';

const BACKDROP_KEY = 'create-form-backdrop';
const DIALOG_KEY = 'create-form-dialog';

const workspaceMenuEase = [0.25, 0.1, 0.25, 1];

const workspaceOptionClass = (selected) =>
  `flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium transition-colors cursor-pointer ${
    selected ? 'bg-[#f4f3ef] text-[#1a1a18]' : 'text-[#6b6966] hover:bg-[#fafaf8]'
  }`;

function WorkspaceDot({ color }) {
  if (color) {
    return (
      <span
        className="size-2 shrink-0 rounded-[4px]"
        style={{ backgroundColor: color }}
        aria-hidden
      />
    );
  }
  return (
    <span
      className="size-2 shrink-0 rounded-[4px] border border-[#d1d0cb] bg-white"
      aria-hidden
    />
  );
}

function WorkspaceDropdown({ workspaceId, onChange, workspaces }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const options = [
    { id: NO_WORKSPACE_ID, label: 'No workspace', color: null },
    ...workspaces.map((ws) => ({ id: ws.id, label: ws.label, color: ws.color })),
  ];

  const selected = options.find((opt) => opt.id === workspaceId) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id="new-form-workspace"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 rounded-[8px] border border-[#e4e0da] bg-[#fafaf8] px-[13px] py-[11px] text-left text-[13px] text-[#1a1814] outline-none transition-colors focus:border-[#1a1814]"
      >
        <span className="flex min-w-0 items-center gap-2">
          <WorkspaceDot color={selected.color} />
          <span className="truncate">{selected.label}</span>
        </span>
        <RiArrowDownSLine
          size={16}
          className={`shrink-0 text-[#7a7670] transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            key="workspace-menu"
            role="listbox"
            aria-labelledby="new-form-workspace"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: workspaceMenuEase }}
            style={{ transformOrigin: 'top center' }}
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-[160px] overflow-y-auto rounded-[8px] border border-[#e4e0da] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] origin-top"
          >
            {options.map((opt) => (
              <li key={opt.id || 'no-workspace'} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={workspaceId === opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className={workspaceOptionClass(workspaceId === opt.id)}
                >
                  <WorkspaceDot color={opt.color} />
                  <span className="truncate">{opt.label}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const CreateNewFormFields = ({ onClose, onCreateAfterExit }) => {
  const dispatch = useDispatch();
  const workspaces = useSelector(selectNavWorkspaces);
  const isOnboardingActive = useSelector(selectIsOnboardingActive);

  const [name, setName] = useState('');
  const [colorId, setColorId] = useState(FORM_COLOR_OPTIONS[0].id);
  const [workspaceId, setWorkspaceId] = useState(NO_WORKSPACE_ID);

  const resetFormFields = () => {
    setName('');
    setColorId(FORM_COLOR_OPTIONS[0].id);
    setWorkspaceId(NO_WORKSPACE_ID);
  };

  const handleClose = () => {
    resetFormFields();
    onClose();
  };

  const handleCreate = () => {
    const title = name.trim() || 'Untitled';
    const theme = getFormColorTheme(colorId);
    const tempId = `temp_${Date.now()}`;
    const newForm = {
      id: tempId,
      title,
      status: 'draft',
      responses: 0,
      timeAgo: 'just now',
      workspace: workspaceId,
      workspaceId: workspaceId === 'none' ? undefined : workspaceId,
      gradientFrom: theme.gradientFrom,
      gradientTo: theme.gradientTo,
      overlayColor: theme.overlayColor,
      iconGradient: theme.iconGradient,
    };

    dispatch(createFormThunk(newForm));
    if (isOnboardingActive) dispatch(completeOnboarding());

    onCreateAfterExit({
      formTitle: title,
      formId: tempId,
      formColor: theme.value,
    });
    resetFormFields();
    onClose();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close"
        className="absolute top-[13px] right-[13px] w-[22px] h-[22px] flex items-center justify-center rounded-[11px] bg-[#dedede] text-[#1a1814] hover:bg-[#d0d0d0] transition-colors cursor-pointer"
      >
        <RiCloseLine size={14} />
      </button>

      <h2
        id="create-new-form-title"
        className="text-[15px] font-semibold text-[#1a1814] leading-[22.5px] tracking-[-0.2px] pr-8"
      >
        Name your form before creating it
      </h2>

      <div className="pt-4 flex flex-col gap-0">
        <label
          htmlFor="new-form-name"
          className="text-[11.5px] font-semibold text-[#7a7670] leading-[17.25px]"
        >
          Form name
        </label>
        <input
          id="new-form-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Untitled"
          autoFocus
          className="mt-2 w-full px-[13px] py-[11px] text-[13px] text-[#1a1814] placeholder:text-[rgba(26,24,20,0.5)] bg-[#fafaf8] border border-[#e4e0da] rounded-[8px] outline-none focus:border-[#1a1814] transition-colors leading-normal"
        />
      </div>

      <div className="pt-3 flex flex-col gap-1.5">
        <label
          htmlFor="new-form-workspace"
          className="text-[11.5px] font-semibold text-[#7a7670] leading-[17.25px]"
        >
          Workspace
        </label>
        <WorkspaceDropdown
          workspaceId={workspaceId}
          onChange={setWorkspaceId}
          workspaces={workspaces}
        />
      </div>

      <div className="pt-3 flex flex-col gap-0">
        <p className="text-[11.5px] font-semibold text-[#7a7670] leading-[17.25px]">Colour</p>
        <div className="flex items-center gap-2 pt-1">
          {FORM_COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setColorId(opt.id)}
              aria-label={`${opt.id} colour`}
              aria-pressed={colorId === opt.id}
              className={`w-[22px] h-[22px] rounded-[11px] shrink-0 transition-transform hover:scale-110 cursor-pointer ${
                colorId === opt.id
                  ? 'border-2 border-[#1a1814] ring-2 ring-white ring-offset-0'
                  : 'border-2 border-transparent'
              }`}
              style={{ backgroundColor: opt.value }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={handleClose}
          className="px-[17px] py-[9px] text-[12.5px] font-medium text-[#7a7670] border border-[#e4e0da] rounded-[8px] hover:bg-[#fafaf8] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center gap-0.5 bg-[#1a1814] text-white text-[12.5px] font-medium px-4 py-[9px] rounded-[8px] hover:bg-[#2c2c2c] transition-colors cursor-pointer whitespace-nowrap"
        >
          Create Form
          <RiArrowRightSLine size={16} className="-mr-0.5" />
        </button>
      </div>
    </>
  );
};

/**
 * Portal + AnimatePresence wrap the conditional (Check A).
 * Custom dialog (not Radix); portal to document.body avoids parent overflow clipping (Check C).
 * Flex-centered dialog avoids Tailwind translate fighting motion scale (entrance bounce).
 */
const CreateNewFormModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const open = useSelector((s) => s.ui.createNewFormModal.open);
  const pendingBuilderStateRef = useRef(null);
  const wasOpenRef = useRef(false);

  const handleClose = () => {
    dispatch(closeCreateNewFormModal());
  };

  const handleExitComplete = () => {
    logModalLifecycle('exit animation complete (onExitComplete)');

    const builderState = pendingBuilderStateRef.current;
    if (!builderState) return;

    pendingBuilderStateRef.current = null;
    logModalLifecycle('starting builder overlay + navigation after modal exit');
    dispatch(startBuilderRouteTransition());
    navigateToFormBuilder(navigate, dispatch, builderState, { showOverlay: false });
  };

  const handleCreateAfterExit = (builderState) => {
    pendingBuilderStateRef.current = builderState;
  };

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      logModalLifecycle('mounted (open=true)');
    }
    if (!open && wasOpenRef.current) {
      logModalLifecycle('open=false — exit animation should run before unmount');
    }
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    return () => {
      logModalLifecycle('component cleanup (portal host unmounting)');
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence onExitComplete={handleExitComplete}>
      {open ? (
        <>
          <motion.div
            key={BACKDROP_KEY}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={createFormModalTransition}
            onClick={handleClose}
            className="fixed inset-0 z-[300] bg-black/20"
          />
          <div
            className="fixed inset-0 z-[301] flex items-center justify-center p-4 pointer-events-none"
            aria-hidden={false}
          >
            <motion.div
              key={DIALOG_KEY}
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-new-form-title"
              initial={modalInitial}
              animate={modalEnter}
              exit={modalExit}
              transition={createFormModalTransition}
              style={{ transformOrigin: 'center center' }}
              className="pointer-events-auto relative w-full max-w-[360px] bg-white rounded-[14px] shadow-[0_8px_16px_rgba(0,0,0,0.12)] p-6 flex flex-col gap-1"
            >
              <CreateNewFormFields
                onClose={handleClose}
                onCreateAfterExit={handleCreateAfterExit}
              />
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
};

export default CreateNewFormModal;
