import { clearBuilderDraft } from '@/features/forms/utils/builderDraftStorage';
import { clearPublishedFormSessionCache } from '@/features/forms/utils/publishedFormSessionCache';
import { readAllFormResponses, writeAllFormResponses } from '@/features/forms/utils/formResponsesStorage';
import { removeKey } from '@/utils/localStorageSafe';

const publishedKey = (formId) => `clearform_published_${formId}`;

/** Remove builder draft, published snapshot, session cache, and cached responses for a form. */
export function clearFormLocalCaches(formId) {
  if (formId == null) return;
  const key = String(formId);
  clearBuilderDraft(formId);
  clearPublishedFormSessionCache(formId);
  removeKey(publishedKey(formId));
  const all = readAllFormResponses();
  if (all[key]) {
    const next = { ...all };
    delete next[key];
    writeAllFormResponses(next);
  }
}
