import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef } from 'react';
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
  const dialogRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.();

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => dialogRef.current?.focus(), 50);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown]);

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
              ref={dialogRef}
              key="profile-modal-dialog"
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
              initial={modalInitial}
              animate={modalEnter}
              exit={modalExit}
              transition={createFormModalTransition}
              style={{ transformOrigin: 'center center', outline: 'none' }}
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
