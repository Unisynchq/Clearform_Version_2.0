import type { Response } from 'express';
import type { PublicFormRenderResult } from './forms.service';

// Browser caches 60s; Cloudflare CDN caches 1h. Cloudflare purge fires on republish
// so the long CDN TTL is safe — respondents always get the latest published version.
const PUBLIC_FORM_CACHE_CONTROL =
  'public, max-age=60, s-maxage=3600, stale-while-revalidate=300';

export function applyPublicFormCacheHeaders(
  res: Response,
  render: PublicFormRenderResult,
): void {
  res.setHeader('Cache-Control', PUBLIC_FORM_CACHE_CONTROL);
  res.setHeader('Vary', 'Accept-Encoding');
  res.setHeader('ETag', render.etag);
  if (render.publishedAt) {
    res.setHeader('X-Clearform-Saved-At', render.publishedAt);
  }
}
