import { createForm, saveBuilderSnapshot } from '@/api/services/formsService';
import { FORM_COLOR_OPTIONS, getFormColorTheme } from '@/features/forms/constants/formColorThemes';

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
  if (snapshot) {
    await saveBuilderSnapshot(formId, {
      ...snapshot,
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
