/**
 * Shared layout tokens for live respondent + builder preview (compact mode).
 * Layout/CSS only — no logic or snapshot fields.
 */

/** Page shell — card layout (margins around the card) */
export const RESPONDENT_PAGE_SHELL =
  'min-h-[100dvh] flex flex-col items-center justify-center px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 sm:py-8 md:p-10';

/** Page shell — full canvas (tighter; content on background) */
export const RESPONDENT_PAGE_SHELL_FULL =
  'min-h-[100dvh] flex flex-col items-center justify-center px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-5 sm:py-6 md:p-10';

/** Inner frame around each screen body */
export const RESPONDENT_SCREEN_FRAME = 'p-0 sm:p-3 md:p-5';

/** Card content body — comfortable (desktop / builder edit) */
export const CARD_BODY_PAD = 'flex flex-col px-14 pt-11 pb-5';

/** Card content body — compact (mobile preview / live narrow viewport) */
export const CARD_BODY_PAD_COMPACT = 'flex flex-col px-5 pt-7 pb-4';

/** Responsive card body: compact prop OR sm/md breakpoints when compactLayout unset */
export const CARD_BODY_PAD_RESPONSIVE =
  'flex flex-col px-5 pt-7 pb-4 sm:px-8 sm:pt-9 md:px-14 md:pt-11 md:pb-5';

export function cardBodyPadClass(compactLayout) {
  if (compactLayout === true) return CARD_BODY_PAD_COMPACT;
  if (compactLayout === false) return CARD_BODY_PAD;
  return CARD_BODY_PAD_RESPONSIVE;
}

export function cardBodyPadXClass(compactLayout) {
  if (compactLayout === true) return 'px-5';
  if (compactLayout === false) return 'px-14';
  return 'px-5 md:px-14';
}

export function cardFooterToolsPadClass(compactLayout) {
  if (compactLayout === true) return 'px-5 py-4';
  if (compactLayout === false) return 'px-14 py-[19px]';
  return 'px-5 py-4 md:px-14 md:py-[19px]';
}

/** Step nav footer */
export const CARD_NAV_PAD = 'px-14 pt-[15px] pb-[18px]';
export const CARD_NAV_PAD_COMPACT = 'px-5 pt-3 pb-4 sm:px-8 md:px-14 md:pt-[15px] md:pb-[18px]';

export function cardNavPadClass(compactLayout) {
  if (compactLayout === true) return 'px-5 pt-3 pb-4';
  if (compactLayout === false) return CARD_NAV_PAD;
  return CARD_NAV_PAD_COMPACT;
}

/** Intro / end inner padding */
export const INTRO_INNER_PAD = 'px-[52px] py-[44px]';
export const INTRO_INNER_PAD_COMPACT = 'px-5 py-8 sm:px-8 md:px-[52px] md:py-[44px]';

export function introInnerPadClass(compactLayout) {
  if (compactLayout === true) return 'px-5 py-8';
  if (compactLayout === false) return INTRO_INNER_PAD;
  return INTRO_INNER_PAD_COMPACT;
}

export const QUESTION_FONT = {
  comfortable: '32px',
  compact: '24px',
  mediaComfortable: '26px',
  mediaCompact: '22px',
};

export function questionFontSize(compactLayout, variant = 'default') {
  const isMedia = variant === 'media';
  if (compactLayout) {
    return isMedia ? QUESTION_FONT.mediaCompact : QUESTION_FONT.compact;
  }
  return isMedia ? QUESTION_FONT.mediaComfortable : QUESTION_FONT.comfortable;
}

/** 2-column field grids */
export const FIELD_GRID_2 = 'grid grid-cols-2 gap-4';
export const FIELD_GRID_2_RESPONSIVE = 'grid grid-cols-1 sm:grid-cols-2 gap-4';

export function fieldGrid2Class(compactLayout) {
  if (compactLayout === true) return 'grid grid-cols-1 gap-4';
  if (compactLayout === false) return FIELD_GRID_2;
  return FIELD_GRID_2_RESPONSIVE;
}

/** Choice list row — ~44px min touch */
export const CHOICE_LIST_ROW_PAD = 'px-4 py-[13px]';
export const CHOICE_LIST_ROW_PAD_COMPACT = 'px-3 py-4 min-h-[44px]';

export function choiceListRowPad(compactLayout) {
  return compactLayout ? CHOICE_LIST_ROW_PAD_COMPACT : CHOICE_LIST_ROW_PAD;
}
