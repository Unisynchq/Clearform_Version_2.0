# API health runbook (`ERR_CONNECTION_CLOSED`)

When the dashboard shows **No forms** and DevTools reports `net::ERR_CONNECTION_CLOSED` on `https://api.clearform.in/api/v1/forms` or `/workspaces`, the browser never got a response from the API origin.

## 1. Quick check (from your Mac)

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://api.clearform.in/api/v1/health
```

Expected: **200**. Anything else (000, 502, 521) → fix VPS/nginx/PM2 before debugging app code.

## 2. On the VPS (SSH)

```bash
pm2 status clearform-backend
pm2 logs clearform-backend --lines 80 --nostream
curl -sS http://127.0.0.1:3000/api/v1/health
df -h /
```

| Symptom | Likely fix |
|---------|------------|
| PM2 `errored` / missing | `cd /var/www/clearform-backend && pm2 start ecosystem.config.cjs` |
| Port 3000 down | `bun run build` then `pm2 restart clearform-backend --update-env` |
| Disk 100% | `bash scripts/vps-disk-cleanup.sh` + `bash scripts/vps-pm2-logrotate-setup.sh` |
| Local health OK, public fails | nginx / Cloudflare SSL (Full strict + valid origin cert) |

## 3. Cloudflare

- `api.clearform.in` → VPS IP, **Proxied**
- SSL/TLS: **Full (strict)** if origin has Let's Encrypt or origin cert
- Temporarily **DNS only** (grey cloud) to test if Cloudflare is the blocker

## 4. After recovery

```bash
cd /var/www/clearform-backend
git pull origin main
bun run build
npx prisma migrate deploy
pm2 restart clearform-backend --update-env
```

## 5. Prevent recurrence

- PM2 logrotate: `scripts/vps-pm2-logrotate-setup.sh`
- Monthly: `scripts/vps-disk-cleanup.sh`
- Upstash quota alerts (see `docs/vps-disk-and-redis.md`)
- External uptime ping: `GET https://api.clearform.in/api/v1/health` every 5 min
