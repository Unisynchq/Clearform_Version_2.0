/** Shared Framer Motion tokens for the form builder shell. */

export const BUILDER_TAB_TRANSITION = { duration: 0.34, ease: [0.25, 0.1, 0.25, 1] };

export const BUILDER_TAB_MOTION = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: BUILDER_TAB_TRANSITION,
};

export const PANEL_WIDTH_SPRING = { type: 'spring', stiffness: 255, damping: 29, mass: 1.05 };

export const PANEL_INNER_SPRING = { type: 'spring', stiffness: 285, damping: 29, mass: 1.05 };

export const PANEL_INNER_SLIDE = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
};

export const SIDEBAR_LAYOUT_SPRING = { type: 'spring', stiffness: 335, damping: 33, mass: 0.98 };

export const SIDEBAR_ROW_MOTION = {
  initial: { opacity: 0, x: -10, height: 0 },
  animate: { opacity: 1, x: 0, height: 'auto' },
  exit: { opacity: 0, x: -8, height: 0 },
};

export const SIDEBAR_ROW_TRANSITION = {
  opacity: { duration: 0.31, ease: [0.25, 0.1, 0.25, 1] },
  x: { duration: 0.31, ease: [0.25, 0.1, 0.25, 1] },
  height: { duration: 0.31, ease: [0.25, 0.1, 0.25, 1] },
  layout: SIDEBAR_LAYOUT_SPRING,
};

/** Delay between closing content picker and opening configure panel */
export const PANEL_SWITCH_DELAY_MS = 280;
