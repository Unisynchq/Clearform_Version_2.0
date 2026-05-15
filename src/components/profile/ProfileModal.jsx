import { AnimatePresence, motion } from 'motion/react';

const ease = [0.25, 0.1, 0.25, 1];

export default function ProfileModal({ open, onClose, children, className = '', widthClass = 'w-[min(100%,440px)]' }) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[300] cursor-default border-0 bg-black/20"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.22, ease }}
            className={`fixed top-1/2 left-1/2 z-[301] max-h-[min(92vh,720px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[12px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)] ${widthClass} ${className}`}
          >
            {children}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
