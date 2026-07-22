import { Logger } from '@nestjs/common';

const log = new Logger('CloudflarePurge');

/**
 * Best-effort purge of published form URLs after republish.
 * Requires CLOUDFLARE_ZONE_ID + CLOUDFLARE_API_TOKEN on the API server.
 */
export async function purgePublishedFormCache(
  apiOrigin: string,
  formId: string,
): Promise<void> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID?.trim();
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!zoneId || !token) return;

  const base = apiOrigin.replace(/\/$/, '');
  const paths = [
    `/api/v1/forms/${formId}/published`,
    `/api/v1/forms/${formId}/render`,
  ].map((p) => `${base}${p}`);

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: paths }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      log.warn(
        `Cloudflare purge failed (${res.status}): ${body.slice(0, 200)}`,
      );
    }
  } catch (err) {
    log.warn(
      `Cloudflare purge error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
