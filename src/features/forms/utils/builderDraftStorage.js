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

export const migrateBuilderDraft = (fromId, toId) => {
  if (typeof window === 'undefined' || fromId == null || toId == null) return;
  try {
    const raw = localStorage.getItem(draftKey(fromId));
    if (!raw) return;
    localStorage.setItem(draftKey(toId), raw);
    localStorage.removeItem(draftKey(fromId));
  } catch {
    // ignore quota errors
  }
};
