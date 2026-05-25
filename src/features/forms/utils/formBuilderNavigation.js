/** Navigation state for opening a form in the builder from the dashboard. */
export const getFormBuilderState = (
  form,
  { preview = false, startInPublishView = false } = {}
) => {
  if (!form) return null;
  return {
    formId: form.id,
    formTitle: form.title,
    ...(form.templateId ? { templateId: form.templateId } : {}),
    ...(preview ? { startInPreview: true } : {}),
    ...(startInPublishView ? { startInPublishView: true } : {}),
  };
};

export const FORM_BUILDER_PATH = '/dashboard/form-builder';
