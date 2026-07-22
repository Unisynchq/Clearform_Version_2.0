# Cloudflare AI protection (Free plan)

Clearform runs **NestJS throttler + Redis per-form limits** as the source of truth for AI and auth abuse. Cloudflare Free has limited path-based WAF rules — use this matrix plus origin limits.

## Route matrix

| Route | Cloudflare Free | Origin (NestJS) |
|-------|-----------------|-----------------|
| `GET /api/v1/forms/*/published`, `/render` | Cache 5m | Redis render cache 30m |
| `GET /api/v1/analytics/forms/*/performance` | Cache 60s | Redis insights cache |
| `GET /api/v1/analytics/forms/*/overview` | Cache 60s | Orchestrator + drop-off |
| `POST /api/v1/forms/*/logic/generate` | **Bypass** | Throttler 20/min + per-form AI limit |
| `POST /api/v1/forms/*/response-quality/evaluate` | **Bypass** | 60/min + 120/min per-form |
| `POST /api/v1/analytics/forms/*/ai-insights` | **Bypass** | 10/min + 8/hr per-form |
| `POST /api/v1/forms/*/responses` | **Bypass** | 30/min |
| `/api/v1/auth/*` | **Bypass** | Strict 10/min |

## Verification

```bash
# Should be BYPASS for POST AI routes
curl -sI -X POST "https://api.clearform.in/api/v1/forms/<id>/logic/generate" \
  -H "Authorization: Bearer <token>" | grep -i cf-cache-status

# Should cache GET overview (after first request)
curl -sI "https://api.clearform.in/api/v1/analytics/forms/<id>/overview" \
  -H "Authorization: Bearer <token>" | grep -i cf-cache-status
```

## Free plan limits

- No advanced WAF rate-limit rules per path on Free — rely on NestJS `@Throttle` and `FormAiRateLimitService`.
- Bot Fight Mode may challenge legitimate API clients — allowlist dashboard origins if needed.
- **Pro upgrade path:** path-based WAF rate rules for `/logic/generate` and `/response-quality/evaluate` before traffic hits VPS.

## Optional Worker (100k req/day free)

If AI endpoints are abused before Pro upgrade, deploy a lightweight Worker that counts requests per IP for:

- `POST .../logic/generate`
- `POST .../response-quality/evaluate`

Return `429` when count exceeds threshold; forward otherwise to origin.

## Auth note

Production sign-in is **Firebase client-side**. Edge protection targets legacy `POST /api/v1/auth/*` and public form submit volume, not Firebase token exchange itself.

## Related docs

- [cloudflare-production.md](./cloudflare-production.md) — DNS, cache rules, purge on republish
- [ai-insights-and-logic.md](./ai-insights-and-logic.md) — AI task contracts
