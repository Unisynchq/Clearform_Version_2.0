import { readJson, writeJson } from '@/utils/localStorageSafe';

const publishedKey = (formId) => `clearform_published_${formId}`;

/** Snapshot written when a form is published — used by the public respondent route. */
export const writePublishedForm = (formId, draft) => {
  if (typeof window === 'undefined' || formId == null || !draft) return;
  writeJson(publishedKey(formId), { ...draft, publishedAt: Date.now() });
};

export const readPublishedForm = (formId) => {
  if (typeof window === 'undefined' || formId == null) return null;
  const data = readJson(publishedKey(formId), null);
  return data && typeof data === 'object' ? data : null;
};
