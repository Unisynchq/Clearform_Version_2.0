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
  const draft = readBuilderDraft(formId);
  if (!draft?.screens?.length) {
    return ['Add at least one question before publishing.'];
  }
  return getPublishBlockers(draft.screens);
}
