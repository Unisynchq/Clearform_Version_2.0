import { isApiConfigured } from '@/config/env';
import { createForm } from '@/api/services/formsService';
import { addForm } from '@/store/slices/formsSlice';
import { buildFormFromTemplate as buildTemplateScreens } from '@/features/templates/utils/buildFormFromTemplate';
import { buildFormFromTemplate as buildFormMeta } from '@/features/onboarding/utils/createFormFromTemplate';
import { navigateToFormBuilder } from '@/features/forms/utils/navigateToFormBuilder';

/** @returns {string|undefined} API workspace id when a workspace is selected in the dashboard */
export function resolveApiWorkspaceId(activeWorkspace) {
  if (!activeWorkspace || activeWorkspace === 'all') return undefined;
  return String(activeWorkspace);
}

/**
 * Create API/local form from catalog template and open the builder.
 * Assigns the active dashboard workspace when one is selected.
 */
export async function createFormFromTemplateAndOpenBuilder({
  template,
  activeWorkspace,
  workspaceId: workspaceIdOverride,
  formTitle: formTitleOverride,
  dispatch,
  navigate,
  showToast,
}) {
  const built = buildTemplateScreens(template.id);
  if (!built) {
    showToast?.({ type: 'error', message: 'This template is not available yet.' });
    return null;
  }

  const title =
    formTitleOverride?.trim() || built.formTitle || template.title || 'Untitled Form';
  const meta = buildFormMeta({ id: template.id, title: template.title ?? title });
  const workspaceId =
    workspaceIdOverride !== undefined
      ? workspaceIdOverride
      : resolveApiWorkspaceId(activeWorkspace);
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
    screens: built.screens,
    formId,
    formTitle: title,
    templateId: template.id,
    intro: built.intro,
    end: built.end,
    nextId: built.nextId,
    theme: built.theme,
    settings: built.settings,
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
    }),
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
    { minDelayMs: 0 },
  );

  return formId;
}
