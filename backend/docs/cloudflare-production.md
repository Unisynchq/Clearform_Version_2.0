# Cloudflare in front of Clearform (reduce VPS load)

Use Cloudflare on **app.clearform.in** and **api.clearform.in** so repeated public form loads and published snapshots are served from the edge, not the VPS origin.

## DNS

- `app.clearform.in` → Vercel (frontend) — orange cloud optional on Vercel
- `api.clearform.in` → VPS IP `147.93.96.250` — **proxied** (orange cloud ON)

## Cache rules (api.clearform.in)

Create a Cache Rule (or Page Rule legacy):

| Match | Cache | TTL | Notes |
|-------|-------|-----|-------|
| `GET /api/v1/forms/*/published` | Eligible | Respect origin `Cache-Control` | Backend sends `max-age=300` + ETag |
| `GET /api/v1/forms/*/render` | Eligible | Same | Published JSON |
| `GET /api/v1/analytics/forms/*/performance` | Eligible | `max-age=60` (origin) | Per-user stats; short TTL |
| `GET /api/v1/analytics/forms/*/overview` | Eligible | `max-age=60` (origin) | Form overlay Overview (B.13) |
| `GET /api/v1/analytics/forms/*/compare` | Eligible | `max-age=60` | Same |
| `GET /api/v1/analytics/forms/*/response-quality` | Eligible | `max-age=60` | Same |
| `POST *` | Bypass | — | Responses, auth, integrations |
| `DELETE *` | Bypass | — | Form delete |
| `PATCH *` | Bypass | — | |
| `/api/v1/auth/*` | Bypass | — | |
| `/api/v1/workspaces/*/integrations/*` | Bypass | — | OAuth |

Enable **Cache by status**: cache 200 responses.

## Cache rules (app.clearform.in)

Vercel already CDN-caches static assets. For public forms:

| Match | Action |
|-------|--------|
| `/f/*` | Standard cache (HTML may be dynamic — prefer short TTL or bypass if auth cookies on same host) |

Public form HTML is SPA — main win is caching **API** `GET .../published`.

## Origin load reduction

- Published form reads hit Cloudflare → fewer Redis/Prisma hits on VPS
- Keep Redis TTL (30m render cache) as second layer

## SSL/TLS

- Full (strict) between Cloudflare and origin if origin has valid cert
- VPS: certbot or Cloudflare Origin Certificate on nginx if terminating TLS at VPS

## After disk cleanup

Run `scripts/vps-disk-cleanup.sh` on VPS before relying on cache — full disk breaks writes (delete form, publish, Prisma).

## Setup checklist (Cloudflare Free — exact dashboard steps)

### 1. DNS (api zone)

1. Log in to [Cloudflare dashboard](https://dash.cloudflare.com) → select the **clearform.in** zone.
2. **DNS** → **Records** → Add or edit:
   - **Type:** `A`
   - **Name:** `api`
   - **IPv4:** `147.93.96.250` (VPS)
   - **Proxy status:** **Proxied** (orange cloud ON)
3. Save. Wait 1–2 minutes for propagation.

`app.clearform.in` stays on Vercel; orange cloud is optional there.

### 2. SSL/TLS

1. **SSL/TLS** → **Overview** → set encryption mode to **Full (strict)**.
2. Origin must present a valid cert (certbot on nginx, or **SSL/TLS → Origin Server → Create certificate** and install on VPS).

### 3. Cache Rules (Free plan — Rules → Cache Rules)

Create **one rule per row** (Free allows limited rules; combine with expression `or` if you hit the slot limit):

| Rule name | Expression (Field: URI Path) | Cache eligibility | Edge TTL |
|-----------|------------------------------|-------------------|----------|
| Cache published | `starts with /api/v1/forms/` **and** `ends with /published` | Eligible | Respect origin |
| Cache render | `starts with /api/v1/forms/` **and** `ends with /render` | Eligible | Respect origin |
| Cache analytics perf | `starts with /api/v1/analytics/forms/` **and** `ends with /performance` | Eligible | Respect origin (60s) |
| Cache analytics compare | `starts with /api/v1/analytics/forms/` **and** `ends with /compare` | Eligible | Respect origin (60s) |
| Cache response quality | `starts with /api/v1/analytics/forms/` **and** `ends with /response-quality` | Eligible | Respect origin (60s) |
| Bypass mutations | `http.request.method ne "GET"` | Bypass cache | — |
| Bypass auth | `starts with /api/v1/auth/` | Bypass cache | — |
| Bypass integrations | `starts with /api/v1/workspaces/` **and** `contains /integrations/` | Bypass cache | — |
| Bypass AI + responses | `ends with /logic/generate` **or** `ends with /response-quality/evaluate` **or** `ends with /ai-insights` **or** `ends with /responses` | Bypass cache | — |

For each **cache-eligible** rule:

- **Cache status:** Enabled
- **Cache by status code:** cache only `200`
- **Edge TTL:** Respect origin `Cache-Control` (NestJS sends `max-age=300` on published/render, `max-age=60` on analytics GETs)

### 4. Verify `cf-cache-status`

```bash
# First request — often MISS or EXPIRED
curl -sI "https://api.clearform.in/api/v1/forms/<FORM_ID>/published" | grep -i cf-cache-status

# Repeat within 5 minutes — expect HIT
curl -sI "https://api.clearform.in/api/v1/forms/<FORM_ID>/published" | grep -i cf-cache-status

# POST must bypass
curl -sI -X POST "https://api.clearform.in/api/v1/forms/<FORM_ID>/responses" \
  -H "Content-Type: application/json" -d '{}' | grep -i cf-cache-status
```

### 5. Optional purge on republish

On VPS `.env`:

- `CLOUDFLARE_ZONE_ID` — zone ID from Cloudflare overview sidebar
- `CLOUDFLARE_API_TOKEN` — token with **Cache Purge** permission
- `API_PUBLIC_URL=https://api.clearform.in`

`forms.service` purges `/published` and `/render` after publish via `src/common/cloudflare-purge.util.ts`.

### 6. AI / auth protection reference

See [cloudflare-ai-protection.md](./cloudflare-ai-protection.md) for the full cache/bypass matrix, Free-tier limits, NestJS throttler mapping, and Pro upgrade path.

## Upstash (pair with Cloudflare)

When Redis hits **500k commands/month**, Bull queues fail and PM2 logs explode. Upgrade Upstash or reset quota; see `docs/vps-disk-and-redis.md`.
