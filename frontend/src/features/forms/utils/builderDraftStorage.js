const draftKey = (formId) => `clearform_builder_draft_${formId}`;

export const readBuilderDraft = (formId) => {
  if (typeof window === 'undefined' || formId == null) return null;
  try {
    const raw = localStorage.getItem(draftKey(formId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const writeBuilderDraft = (formId, draft) => {
  if (typeof window === 'undefined' || formId == null) return;
  try {
    localStorage.setItem(draftKey(formId), JSON.stringify(draft));
  } catch {
    // ignore quota errors
  }
};

export const clearBuilderDraft = (formId) => {
  if (typeof window === 'undefined' || formId == null) return;
  localStorage.removeItem(draftKey(formId));
};
