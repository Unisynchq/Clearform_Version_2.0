import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';

const tooltipEase = [0.25, 0.1, 0.25, 1];

/**
 * Lightweight hover tooltip aligned to the right of the trigger (sidebar-friendly).
 */
export default function Tooltip({
  content,
  delay = 200,
  disabled = false,
  placement = 'right',
  children,
}) {
  const tooltipId = useId();
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updateCoords = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const gap = 8;
    if (placement === 'right') {
      setCoords({
        top: rect.top + rect.height / 2,
        left: rect.right + gap,
      });
      return;
    }
    setCoords({
      top: rect.bottom + gap,
      left: rect.left + rect.width / 2,
    });
  }, [placement]);

  const show = useCallback(() => {
    if (disabled || !content) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      updateCoords();
      setVisible(true);
    }, delay);
  }, [content, delay, disabled, updateCoords]);

  const hide = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  useEffect(() => {
    if (!visible) return undefined;
    const handleReposition = () => updateCoords();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [visible, updateCoords]);

  if (typeof document === 'undefined') {
    return children;
  }

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={visible && content ? tooltipId : undefined}
        className="min-w-0 flex-1"
      >
        {children}
      </span>
      {createPortal(
        <AnimatePresence>
          {visible && content ? (
            <motion.div
              id={tooltipId}
              role="tooltip"
              initial={{ opacity: 0, x: placement === 'right' ? -4 : 0, y: placement === 'right' ? 0 : -4 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: placement === 'right' ? -4 : 0, y: placement === 'right' ? 0 : -4 }}
              transition={{ duration: 0.14, ease: tooltipEase }}
              style={
                placement === 'right'
                  ? { top: coords.top, left: coords.left, transform: 'translateY(-50%)' }
                  : { top: coords.top, left: coords.left, transform: 'translateX(-50%)' }
              }
              className="pointer-events-none fixed z-[500] max-w-[min(280px,calc(100vw-24px))] text-[13px] font-medium leading-[19.5px] text-[#1a1a1c]"
            >
              {content}
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
