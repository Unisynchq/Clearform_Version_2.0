/** Shared Motion easing — matches dashboard / profile surfaces */
export const pageEase = [0.25, 0.1, 0.25, 1];
export const panelEase = pageEase;

export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
};

export const fadeUpTransition = (duration = 0.22) => ({
  duration,
  ease: pageEase,
});

export const fadeInOut = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 12 },
};
