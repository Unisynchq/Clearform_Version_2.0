import { createForm, saveBuilderSnapshot } from '@/api/services/formsService';
import { FORM_COLOR_OPTIONS, getFormColorTheme } from '@/features/forms/constants/formColorThemes';

/** sessionStorage key set after createForm() until the builder URL includes that id. */
export const PENDING_FORM_ID_STORAGE_KEY = 'clearform_pending_form_id';

let persistFormInFlight = null;

export function getPendingFormId() {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(PENDING_FORM_ID_STORAGE_KEY);
  return raw || null;
}

export function setPendingFormId(formId) {
  if (typeof sessionStorage === 'undefined' || formId == null || formId === '') return;
  sessionStorage.setItem(PENDING_FORM_ID_STORAGE_KEY, String(formId));
}

export function clearPendingFormId() {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(PENDING_FORM_ID_STORAGE_KEY);
}

/** Await an in-flight persist/create so concurrent callers share one API create. */
export function getPersistFormInFlight() {
  return persistFormInFlight;
}

export function runPersistFormInFlight(factory) {
  if (persistFormInFlight) return persistFormInFlight;
  persistFormInFlight = Promise.resolve()
    .then(factory)
    .finally(() => {
      persistFormInFlight = null;
    });
  return persistFormInFlight;
}

/**
 * Create a draft form on the API and optionally persist the builder snapshot.
 * Used when opening the builder from a template without a form id yet.
 */
export async function createFormAndSaveSnapshot({
  title,
  templateId,
  snapshot,
  workspaceId,
}) {
  const theme = getFormColorTheme(FORM_COLOR_OPTIONS[0].id);
  const created = await createForm({
    title: title?.trim() || 'Untitled Form',
    workspaceId,
    gradientFrom: theme.gradientFrom,
    gradientTo: theme.gradientTo,
    overlayColor: theme.overlayColor,
    iconGradient: theme.iconGradient,
  });
  const formId = created.id;
  setPendingFormId(formId);
  if (snapshot) {
    await saveBuilderSnapshot(formId, {
      ...snapshot,
      version: snapshot.version ?? 1,
      formId,
      templateId: templateId ?? snapshot.templateId,
    });
  }
  return {
    id: formId,
    title: created.title ?? title,
    gradientFrom: theme.gradientFrom,
    gradientTo: theme.gradientTo,
    overlayColor: theme.overlayColor,
    iconGradient: theme.iconGradient,
  };
}
