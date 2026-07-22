import { isApiConfigured } from '@/config/env';
import { readBuilderDraft } from '@/features/forms/utils/builderDraftStorage';

export function getPublishBlockers(screens) {
  const contentScreens = (screens ?? []).filter((s) => s.type === 'content');
  if (contentScreens.length === 0) {
    return ['Add at least one question before publishing.'];
  }
  return [];
}

export function canPublishForm(screens) {
  return getPublishBlockers(screens).length === 0;
}

export function getPublishBlockersForFormId(formId) {
  if (isApiConfigured()) {
    return ['Add at least one question before publishing.'];
  }
  const draft = readBuilderDraft(formId);
  if (!draft?.screens?.length) {
    return ['Add at least one question before publishing.'];
  }
  return getPublishBlockers(draft.screens);
}

/** Async publish blockers — loads builder snapshot from API when configured. */
export async function getPublishBlockersForFormIdAsync(formId) {
  if (!isApiConfigured()) {
    return getPublishBlockersForFormId(formId);
  }
  try {
    const { getBuilderSnapshot } = await import('@/api/services/formsService');
    const res = await getBuilderSnapshot(formId);
    const snap = res?.snapshot ?? res;
    if (!snap?.screens?.length) {
      return ['Add at least one question before publishing.'];
    }
    return getPublishBlockers(snap.screens);
  } catch {
    return ['Could not load form draft.'];
  }
}
