/**
 * Normalize a form URL before it is emitted into an embed <iframe> src.
 *
 * Browsers block mixed-content iframes on HTTPS pages, so an embed snippet
 * must never ship an `http://` src for a non-local host. This also resolves
 * relative URLs (e.g. `/f/<id>`) against the app origin and recovers when the
 * backend returns a scheme-less host.
 */
export function normalizeEmbedSrc(url) {
  if (!url) return url;
  let value = url;
  try {
    new URL(value);
  } catch {
    if (value.startsWith('/')) {
      value = `${typeof window !== 'undefined' ? window.location.origin : ''}${value}`;
    }
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'http:') {
      const isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(
        parsed.hostname,
      );
      if (!isLocalHost) {
        parsed.protocol = 'https:';
        return parsed.toString();
      }
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function buildEmbedCode(url) {
  const src = normalizeEmbedSrc(url);
  return `<iframe\n  src="${src}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  allow="fullscreen"\n></iframe>`;
}
