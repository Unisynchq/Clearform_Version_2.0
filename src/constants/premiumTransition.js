/**
 * Shared spring for modal enter/exit and dashboard push-back (sidebar + main).
 * stiffness 350 · damping 30 · mass 1
 */
export const premiumTransition = {
  type: 'spring',
  stiffness: 350,
  damping: 30,
  mass: 1,
};

export const dashboardPushBackActive = {
  scale: 0.97,
  opacity: 0.8,
  filter: 'blur(3px)',
};

export const dashboardPushBackIdle = {
  scale: 1,
  opacity: 1,
  filter: 'blur(0px)',
};

export const modalEnter = {
  opacity: 1,
  scale: 1,
};

export const modalExit = {
  opacity: 0,
  scale: 0.9,
};

export const modalInitial = {
  opacity: 0,
  scale: 0.9,
};

/** Slightly softer spring for Create New Form (less abrupt than dashboard modals). */
export const createFormModalTransition = {
  type: 'spring',
  stiffness: 260,
  damping: 30,
  mass: 1.05,
};

/** Dev-only probe for exit lifecycle verification (Check B) */
export const logModalLifecycle = (phase, detail = '') => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(`[CreateNewFormModal] ${phase}${detail ? ` — ${detail}` : ''}`);
  }
};
