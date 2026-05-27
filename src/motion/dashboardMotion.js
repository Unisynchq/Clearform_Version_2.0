import { pageEase } from '@/motion/presets';

/** Minimum time the dashboard skeleton stays visible (feels intentional, not a flash). */
export const DASHBOARD_MIN_LOAD_MS = 420;

export const DASHBOARD_PAGE_EASE = pageEase;

export const DASHBOARD_HEADING_MOTION = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.34, ease: DASHBOARD_PAGE_EASE, delay: 0.06 },
};

export const DASHBOARD_SECTION_MOTION = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: DASHBOARD_PAGE_EASE },
};

export const DASHBOARD_CONTENT_MOTION = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: 0.34, ease: DASHBOARD_PAGE_EASE, delay: 0.1 },
};

export const dashboardGridItemTransition = (index) => ({
  duration: 0.32,
  delay: 0.12 + index * 0.05,
  ease: DASHBOARD_PAGE_EASE,
});

export const DASHBOARD_LIST_MOTION = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.32, ease: DASHBOARD_PAGE_EASE, delay: 0.1 },
};

export const DASHBOARD_ROUTE_ENTER = {
  opacity: 1,
  y: 0,
  scale: 1,
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

export const DASHBOARD_ROUTE_INITIAL = {
  opacity: 0,
  y: 10,
  scale: 0.992,
};
