import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'motion/react';
import {
  RiCloseLine,
  RiCheckLine,
  RiAlertLine,
  RiInformationLine,
  RiArrowGoBackLine,
} from 'react-icons/ri';
import { removeToast } from '@/store/slices/toastSlice';

/* Variant tokens — error variant matches Figma node 1139:44908 ("Templates - Load Fail" toast).
   Other variants follow the same visual language: tinted background, circular icon swatch,
   soft brand-tinted shadow, and outlined action button. */
const TOAST_VARIANTS = {
  success: {
    bg:     '#dcfce7',
    iconBg: 'rgba(22, 163, 74, 0.25)',
    text:   '#14532d',
    border: '#22c55e',
    shadow: '0 4px 12px 0 rgba(34, 197, 94, 0.10)',
    Icon:   RiCheckLine,
  },
  error: {
    bg:     '#fae0dc',
    iconBg: 'rgba(220, 38, 38, 0.25)',
    text:   '#5c1a13',
    border: '#e05c4b',
    shadow: '0 4px 12px 0 rgba(224, 92, 75, 0.10)',
    Icon:   RiCloseLine,
  },
  warning: {
    bg:     '#fef3c7',
    iconBg: 'rgba(217, 119, 6, 0.25)',
    text:   '#78350f',
    border: '#d97706',
    shadow: '0 4px 12px 0 rgba(245, 158, 11, 0.10)',
    Icon:   RiAlertLine,
  },
  info: {
    bg:     '#dbeafe',
    iconBg: 'rgba(37, 99, 235, 0.25)',
    text:   '#1e3a8a',
    border: '#2563eb',
    shadow: '0 4px 12px 0 rgba(59, 130, 246, 0.10)',
    Icon:   RiInformationLine,
  },
  undo: {
    bg:     '#1a1a1c',
    iconBg: 'rgba(255, 255, 255, 0.15)',
    text:   '#ffffff',
    border: 'rgba(255, 255, 255, 0.45)',
    shadow: '0 4px 12px 0 rgba(0, 0, 0, 0.18)',
    Icon:   RiArrowGoBackLine,
  },
};

const Toast = ({ id, type = 'info', message, duration = 3000, action }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(id)), duration);
    return () => clearTimeout(timer);
  }, [id, duration, dispatch]);

  const v = TOAST_VARIANTS[type] || TOAST_VARIANTS.info;
  const Icon = v.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.96 }}
      transition={{
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      role="alert"
      className="flex items-center gap-3 h-[48px] pl-[11px] pr-[11px] rounded-[12px] min-w-[300px] max-w-[520px]"
      style={{ backgroundColor: v.bg, color: v.text, boxShadow: v.shadow }}
    >
      {/* Tinted icon swatch */}
      <div
        className="flex items-center justify-center shrink-0 w-[20px] h-[20px] rounded-[10px]"
        style={{ backgroundColor: v.iconBg }}
      >
        <Icon size={12} style={{ color: v.text }} />
      </div>

      {/* Message */}
      <span
        className="flex-1 text-[13px] font-normal leading-[19.5px] truncate"
        style={{ color: v.text }}
      >
        {message}
      </span>

      {/* Optional action (e.g. Retry / Undo) */}
      {action && (
        <button
          onClick={() => {
            action.onClick?.();
            dispatch(removeToast(id));
          }}
          className="shrink-0 h-[24px] flex items-center px-[11px] rounded-[8px] border bg-transparent text-[12px] font-medium leading-none transition-colors hover:bg-white/40 cursor-pointer"
          style={{ borderColor: v.border, color: v.text }}
        >
          {action.label}
        </button>
      )}

      {/* Close */}
      <button
        onClick={() => dispatch(removeToast(id))}
        aria-label="Dismiss"
        className="shrink-0 w-5 h-5 flex items-center justify-center rounded-[6px] transition-opacity hover:opacity-60 cursor-pointer"
      >
        <RiCloseLine size={16} style={{ color: v.text }} />
      </button>
    </motion.div>
  );
};

export default Toast;
