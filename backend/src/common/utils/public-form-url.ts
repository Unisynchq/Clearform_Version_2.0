export function buildPublicFormUrl(origin: string, formId: string): string {
  const base = origin.replace(/\/+$/, '');
  return `${base}/f/${formId}`;
}

export function buildPublicFormShortDisplay(
  origin: string,
  formId: string,
): string {
  const url = new URL(buildPublicFormUrl(origin, formId));
  return `${url.host}${url.pathname}`;
}

export function slugifyFormTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'form'
  );
}
