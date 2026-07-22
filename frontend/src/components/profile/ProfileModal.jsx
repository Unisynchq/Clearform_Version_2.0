import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  createFormModalTransition,
  modalEnter,
  modalExit,
  modalInitial,
} from '@/constants/premiumTransition';

export default function ProfileModal({
  open,
  onClose,
  children,
  className = '',
  widthClass = 'w-[min(100%,440px)]',
}) {
  const hasCustomSurface = /\bbg-/.test(className);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="profile-modal-backdrop"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={createFormModalTransition}
            onClick={onClose}
            className="fixed inset-0 z-[9998] bg-black/20"
          />
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
            aria-hidden={false}
          >
            <motion.div
              key="profile-modal-dialog"
              role="dialog"
              aria-modal="true"
              initial={modalInitial}
              animate={modalEnter}
              exit={modalExit}
              transition={createFormModalTransition}
              style={{ transformOrigin: 'center center' }}
              className={`pointer-events-auto max-h-[min(92vh,720px)] overflow-y-auto rounded-[14px] shadow-[0_24px_60px_rgba(0,0,0,0.18)] ${hasCustomSurface ? '' : 'bg-white'} ${widthClass} ${className}`}
            >
              {children}
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
