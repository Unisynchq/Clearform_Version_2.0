import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  RiEyeLine,
  RiEditLine,
  RiShareLine,
  RiFileCopyLine,
  RiBarChartLine,
  RiDownloadLine,
  RiPauseLine,
  RiPlayLine,
  RiArchiveLine,
  RiDeleteBinLine,
} from 'react-icons/ri';
import { closeContextMenu, openDeleteModal, openDuplicateModal, openArchiveModal, openPauseModal, openShareModal, openCompareMode } from '@/store/slices/uiSlice';
import { clearFormPause } from '@/store/slices/formsSlice';
import { isFormPaused } from '../utils/formPause';
import { getFormBuilderState } from '../utils/formBuilderNavigation';
import { navigateToFormBuilder } from '../utils/navigateToFormBuilder';

const MENU_ITEMS = [
  { id: 'view', icon: RiEyeLine, label: 'View responses' },
  { id: 'edit', icon: RiEditLine, label: 'Edit form' },
  { id: 'share', icon: RiShareLine, label: 'Share' },
  { id: 'duplicate', icon: RiFileCopyLine, label: 'Duplicate' },
  { id: 'compare', icon: RiBarChartLine, label: 'Compare' },
  { id: 'export', icon: RiDownloadLine, label: 'Export responses' },
  { id: 'pause', icon: RiPauseLine, label: 'Pause form' },
  { id: 'archive', icon: RiArchiveLine, label: 'Archive' },
  { id: 'delete', icon: RiDeleteBinLine, label: 'Delete', danger: true },
];

const FormContextMenu = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { open, formId, x, y } = useSelector((s) => s.ui.contextMenu);
  const form = useSelector((s) => s.forms.forms.find((f) => f.id === formId));
  const menuRef = useRef(null);

  /* Close on outside click or Escape */
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        dispatch(closeContextMenu());
      }
    };
    const handleKey = (e) => { if (e.key === 'Escape') dispatch(closeContextMenu()); };
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, dispatch]);

  const handleItem = (itemId) => {
    if (itemId === 'delete') {
      dispatch(openDeleteModal({ formId, formTitle: form?.title ?? '' }));
    } else if (itemId === 'duplicate') {
      dispatch(openDuplicateModal({ formId, formTitle: form?.title ?? '' }));
    } else if (itemId === 'archive') {
      dispatch(openArchiveModal({ formId, formTitle: form?.title ?? '', responses: form?.responses ?? 0 }));
    } else if (itemId === 'share') {
      dispatch(openShareModal({ formId, formTitle: form?.title ?? '' }));
    } else if (itemId === 'compare') {
      dispatch(openCompareMode({ formId }));
    } else if (itemId === 'view') {
      if (formId != null) {
        navigate(`/dashboard/analytics?form=${formId}&tab=responses`);
      }
      dispatch(closeContextMenu());
    } else if (itemId === 'edit') {
      const builderState = getFormBuilderState(form);
      if (builderState) {
        navigateToFormBuilder(navigate, dispatch, builderState);
      }
      dispatch(closeContextMenu());
    } else if (itemId === 'pause') {
      if (isFormPaused(form)) {
        dispatch(clearFormPause(formId));
      } else {
        dispatch(openPauseModal({ formId, formTitle: form?.title ?? '' }));
      }
      dispatch(closeContextMenu());
    } else {
      dispatch(closeContextMenu());
    }
  };

  /* Clamp to viewport */
  const safeX = Math.min(x, window.innerWidth - 220);
  const safeY = Math.min(y, window.innerHeight - 328);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ top: safeY, left: safeX }}
          className="fixed z-[200] bg-white border border-[#e5e3dc] rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] py-1.5 w-[196px]"
        >
          {MENU_ITEMS.map((item, i) => {
            const formPaused = item.id === 'pause' && isFormPaused(form);
            const Icon = formPaused ? RiPlayLine : item.icon;
            const label = formPaused ? 'Resume form' : item.label;
            const isDelete = item.danger;
            const showDivider = i === MENU_ITEMS.length - 2;
            return (
              <div key={item.id}>
                {showDivider && <div className="h-px bg-[#e5e3dc] mx-2 my-1" />}
                <button
                  onClick={() => handleItem(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-[7px] text-[13px] font-medium leading-[19.5px] transition-colors ${
                    isDelete
                      ? 'text-[#d4522a] hover:bg-[#f4f3ef] cursor-pointer'
                      : 'text-[#1a1a1c] hover:bg-[#f4f3ef] cursor-pointer'
                  }`}
                >
                  <Icon size={14} className={isDelete ? 'text-[#d4522a]' : 'text-[#6b6966]'} />
                  {label}
                </button>
              </div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FormContextMenu;
