import { motion } from 'motion/react';
import {
  PANEL_INNER_SLIDE,
  PANEL_INNER_SPRING,
  PANEL_WIDTH_SPRING,
} from '@/features/forms/formBuilder/builderMotion';

/** Width-spring shell + inner slide for right-side builder panels */
export default function BuilderRightPanelShell({
  panelKey,
  width = 280,
  skipInitial = false,
  absolute = false,
  children,
}) {
  return (
    <motion.div
      key={panelKey}
      initial={skipInitial ? false : { width: 0 }}
      animate={{ width }}
      exit={{ width: 0 }}
      transition={PANEL_WIDTH_SPRING}
      className={`shrink-0 overflow-hidden h-full${
        absolute ? ' absolute right-0 top-0 bottom-0 z-[70] pointer-events-auto' : ''
      }`}
    >
      <motion.div
        initial={PANEL_INNER_SLIDE.initial}
        animate={PANEL_INNER_SLIDE.animate}
        exit={PANEL_INNER_SLIDE.exit}
        transition={PANEL_INNER_SPRING}
        className="h-full"
        style={{ width }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
