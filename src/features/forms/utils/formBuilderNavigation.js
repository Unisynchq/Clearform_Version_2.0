/** Navigation state for opening a form in the builder from the dashboard. */
export const getFormBuilderState = (form, { preview = false } = {}) => {
  if (!form) return null;
  return {
    formId: form.id,
    formTitle: form.title,
    ...(form.templateId ? { templateId: form.templateId } : {}),
    ...(preview ? { startInPreview: true } : {}),
  };
};

export const FORM_BUILDER_PATH = '/dashboard/form-builder';

/** URL segment for forms without a persisted id yet. */
export const FORM_BUILDER_NEW_SEGMENT = 'new';

/**
 * @param {string|number|null|undefined} formId
 * @returns {string}
 */
export function getFormBuilderPath(formId) {
  if (formId == null || formId === '') {
    return `${FORM_BUILDER_PATH}/${FORM_BUILDER_NEW_SEGMENT}`;
  }
  return `${FORM_BUILDER_PATH}/${formId}`;
}

/**
 * @param {string|undefined} routeParam — from useParams().formId
 * @returns {string|number|null} — numeric legacy ids or API UUID/CUID strings
 */
export function parseFormBuilderRouteId(routeParam) {
  if (!routeParam || routeParam === FORM_BUILDER_NEW_SEGMENT) return null;
  if (/^\d+$/.test(routeParam)) {
    const n = Number(routeParam);
    return Number.isFinite(n) ? n : routeParam;
  }
  return routeParam;
}
