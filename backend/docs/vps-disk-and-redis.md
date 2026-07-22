# VPS disk + Upstash Redis

## Disk: PM2 logs (most common cause of a “full” 100GB VPS)

If `du -sh /root/.pm2` shows **tens of GB**, the API is fine — **PM2 log files** grew without rotation.

```bash
cd /var/www/clearform-backend
git pull origin main

pm2 stop clearform-backend
du -sh /root/.pm2

# Free space (~89GB typical)
find /root/.pm2/logs -type f -delete
truncate -s 0 /root/.pm2/pm2.log 2>/dev/null || true
pm2 flush

df -h /

bash scripts/vps-pm2-logrotate-setup.sh
bash scripts/vps-disk-cleanup.sh

pm2 start ecosystem.config.cjs
pm2 save
curl -sS https://api.clearform.in/api/v1/health
```

Expected after cleanup: **~2–4GB** used on a single-app VPS (`clearform-backend` ~1GB + OS).

## Upstash Pro (recommended for production)

When upgrading to **Upstash Redis Pro** or pay-as-you-go:

1. Upstash console → database → **Upgrade** or enable pay-as-you-go.
2. Copy the new `REDIS_URL` if the connection string changed.
3. On VPS (`/var/www/clearform-backend/.env`):
   - Set `REDIS_URL=rediss://...`
   - Set `AI_INSIGHTS_USE_QUEUE=true`
   - Optional for LiteLLM semantic cache: parse host/port/password into `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` for `docker/litellm/litellm.config.yaml`
4. Restart: `pm2 restart clearform-backend --update-env`
5. Verify: `curl -sS https://api.clearform.in/api/v1/health` → `"redis":"ok"`

After Pro is live, Bull queues (`bull:ai-insights`, `bull:ai-quality`, `bull:webhooks`, `bull:responses`) run reliably without monthly command exhaustion.

## Redis: Upstash `max requests limit exceeded`

BullMQ queues (`bull:webhooks`, `bull:ai-insights`, `bull:ai-quality`) poll Redis constantly. When the free tier hits **500k commands/month**, every poll errors and PM2 logs **millions** of `ReplyError` lines → disk fills again.

**Fix (do both):**

1. **Upstash console** → your Redis database → **Reset quota** (new billing cycle) or **upgrade** plan / enable pay-as-you-go.
2. Optional: **Flush DB** (deletes cache + queue keys; API recreates cache on traffic). Only if you accept clearing queues.
3. Redeploy backend with `retryStrategy` backoff (see `connection.options.ts`) so a quota outage does not spam logs.

After Redis works again:

```bash
pm2 restart clearform-backend --update-env
```

## Hostinger panel still shows “96 GB used”?

The VPS **inside SSH** is the source of truth. After PM2 log cleanup you should see:

```bash
df -h /
# e.g. 6–7% used, ~90G Avail
```

Ubuntu login banner should say something like `Usage of /: 6.7% of 95.82GB`.

Hostinger **Overview → Disk usage** often **lags by hours** (cached metrics). Hard-refresh the browser or check again later; it is not reading your disk live on every page load. If `df` is ~7% but the panel still shows 96 GB after **24 hours**, open Hostinger support with a screenshot of `df -h /` from SSH.

## Hostinger panel (maintenance)

- Delete **old VPS snapshots** you do not need (Backups & Monitoring).
- **Docker Manager**: if unused, `docker system prune -af` (your `du` showed ~47M — not the main issue).

## Prevent recurrence

- Run `bash scripts/vps-disk-cleanup.sh` monthly or after incidents.
- Keep **pm2-logrotate** installed (`scripts/vps-pm2-logrotate-setup.sh`).
- Monitor Upstash **commands** usage in the Upstash dashboard.

## Degraded mode (Redis unavailable or quota exceeded)

When Upstash fails, the API should **stay up** with best-effort behavior (`src/redis/redis-cache.util.ts`):

| Feature | Degraded behavior |
|---------|-------------------|
| Published form render cache | Skip Redis; read/write Prisma directly |
| Analytics AI insights cache | Skip Redis; compute inline |
| AI / response-quality rate limits | In-memory per-process fallback (weaker on multi-instance PM2) |
| Bull queues | May fail to enqueue; insights can run sync when `AI_INSIGHTS_USE_QUEUE` is not `true` |

After Upstash recovery: `pm2 restart clearform-backend --update-env`. Pair with Upstash upgrade if quota is routinely hit.

## Redis degraded mode (API stays up)

When Upstash is down or over quota, the API should **not** crash published reads or auth:

- `safeRedisGet` / `safeRedisSet` / `safeRedisDel` in `src/redis/redis-cache.util.ts` — log once, continue without cache.
- Published forms: Prisma is the source of truth; render cache is optional.
- AI rate limits: in-memory per-process fallback in `FormAiRateLimitService` (weaker on multi-instance).
- Bull queues may still fail until Redis recovers — restart PM2 after quota reset.
