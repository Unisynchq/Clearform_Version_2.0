import { isApiConfigured } from '@/config/env';
import { createForm } from '@/api/services/formsService';
import { addForm } from '@/store/slices/formsSlice';
import { buildFormFromTemplate as buildFormMeta } from '@/features/onboarding/utils/createFormFromTemplate';
import { navigateToFormBuilder } from '@/features/forms/utils/navigateToFormBuilder';
import { findSavedTemplate } from '@/features/templates/utils/savedTemplatesStorage';
import { resolveApiWorkspaceId } from '@/features/forms/utils/createFormFromTemplateFlow';

/**
 * Create a new form from a user-saved template snapshot and open the builder.
 */
export async function createFormFromUserTemplateAndOpenBuilder({
  template,
  userEmail,
  activeWorkspace,
  workspaceId: workspaceIdOverride,
  formTitle: formTitleOverride,
  dispatch,
  navigate,
  showToast,
}) {
  const saved = template.isUserTemplate
    ? findSavedTemplate(userEmail, template.id)
    : null;

  if (!saved?.snapshot) {
    showToast?.({ type: 'error', message: 'This template is not available.' });
    return null;
  }

  const title = formTitleOverride?.trim() || saved.title || template.title || 'Untitled Form';
  const workspaceId =
    workspaceIdOverride !== undefined
      ? workspaceIdOverride
      : resolveApiWorkspaceId(activeWorkspace);

  const meta = buildFormMeta({ id: template.id, title: template.title ?? title });
  let formId = meta.id;

  if (isApiConfigured()) {
    const created = await createForm({
      title,
      workspaceId,
      gradientFrom: meta.gradientFrom,
      gradientTo: meta.gradientTo,
      overlayColor: meta.overlayColor,
      iconGradient: meta.iconGradient,
    });
    formId = created.id;
  }

  const builderSnapshot = {
    ...saved.snapshot,
    formId,
    formTitle: title,
    templateId: template.id,
    savedAt: Date.now(),
  };

  dispatch(
    addForm({
      ...meta,
      id: formId,
      title,
      templateId: template.id,
      workspace: workspaceId ?? '',
      builderSnapshot,
      isUserTemplate: true,
    })
  );

  navigateToFormBuilder(
    navigate,
    dispatch,
    {
      templateId: template.id,
      templateTitle: template.title,
      formTitle: title,
      formId,
      workspaceId,
    },
    { minDelayMs: 0 }
  );

  return formId;
}
