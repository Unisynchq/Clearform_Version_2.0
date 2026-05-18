import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { RiCheckLine, RiCloseLine } from 'react-icons/ri';

/** Figma 2500:1156 / 2500:1145 — Success simple toast */
export default function ProfileSuccessToast({
  message,
  duration = 3200,
  onDismiss,
  className = '',
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);
    return () => window.clearTimeout(timeoutId);
  }, [duration, onDismiss]);

  if (!visible) return null;

  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className={`relative flex items-center gap-3 overflow-hidden rounded-[12px] bg-[#d6f0e0] px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.1)] ${className}`}
    >
      <div className="flex size-5 shrink-0 items-center justify-center rounded-[10px] bg-[#8fcfae] text-[#1a4731]">
        <RiCheckLine size={12} aria-hidden />
      </div>
      <p className="min-w-0 flex-1 text-[13px] leading-[19.5px] text-[#1a4731]">{message}</p>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          onDismiss?.();
        }}
        className="shrink-0 rounded-[6px] p-0.5 text-[#1a4731] transition-opacity hover:opacity-60"
        aria-label="Dismiss"
      >
        <RiCloseLine size={16} />
      </button>
      <motion.div
        className="absolute bottom-0 left-0 h-[2px] rounded-bl-[12px] bg-[#4caf7d]"
        initial={{ width: '100%' }}
        animate={{ width: '85%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        aria-hidden
      />
    </motion.div>
  );
}
