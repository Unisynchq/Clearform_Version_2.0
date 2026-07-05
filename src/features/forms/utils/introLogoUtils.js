/** True when the URL can load outside the uploader's browser session. */
export function isDurableIntroLogoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('blob:')) return false;
  return (
    url.startsWith('data:')
    || url.startsWith('http://')
    || url.startsWith('https://')
    || url.startsWith('/')
    || url.includes('/assets/')
  );
}

export function resolveIntroLogoUrl(logo, fallback) {
  return isDurableIntroLogoUrl(logo) ? logo : fallback;
}
