import { AnimatePresence, motion } from 'motion/react';
import { RiFolderFill, RiFolderOpenFill } from 'react-icons/ri';

const swapEase = [0.25, 0.1, 0.25, 1];

/**
 * Workspace indicator: a folder rendered in the workspace color that smoothly
 * crossfades between closed and open states. Used in the sidebar (open when the
 * workspace is active) and the create-form dropdown (open when selected/expanded).
 */
export default function WorkspaceFolderIcon({
  color = '#6b6966',
  open = false,
  size = 18,
  className = '',
}) {
  const Icon = open ? RiFolderOpenFill : RiFolderFill;
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <AnimatePresence initial={false}>
        <motion.span
          key={open ? 'open' : 'closed'}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.18, ease: swapEase }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Icon size={size} style={{ color }} />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
