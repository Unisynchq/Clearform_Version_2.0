/**
 * Preview/respondent local field state should hydrate only when entering a screen,
 * not when the parent passes updated snap data on every keystroke.
 */
export function shouldHydratePreviewFromScreenChange(prevScreenId, nextScreenId, isPreviewMode) {
  if (!isPreviewMode || nextScreenId == null) return false;
  return prevScreenId !== nextScreenId;
}
