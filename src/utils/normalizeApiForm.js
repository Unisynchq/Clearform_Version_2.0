/** Flatten API form shape for dashboard UI (settings.responseLimit → responseLimit, etc.). */

function formatShortDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

export function normalizeApiForm(form) {
  if (!form || typeof form !== 'object') return form;

  const responseLimit =
    form.settings?.responseLimit ??
    form.responseLimit ??
    500;

  const publishedAt = form.publishedAt ?? null;
  let daysActive = form.daysActive;
  if ((!daysActive || daysActive < 1) && publishedAt) {
    const ms = Date.now() - new Date(publishedAt).getTime();
    daysActive = Math.max(1, Math.ceil(ms / 86_400_000));
  }

  return {
    ...form,
    responseLimit,
    publishedAt,
    daysActive: daysActive ?? form.daysActive,
    startedDate: form.startedDate ?? formatShortDate(publishedAt),
  };
}

export function normalizeApiForms(forms) {
  if (!Array.isArray(forms)) return forms;
  return forms.map(normalizeApiForm);
}
