# Sentry production alerts → Linear (CLE-9)

Wire this once in the Sentry dashboard so production errors auto-create Linear issues (integration already linked per `memory.md`).

**API not receiving events?** See `docs/sentry-api-setup.md` — set `SENTRY_DSN` on the VPS and run the verify endpoint.

## Projects

| App | Sentry project | Release tag |
|-----|----------------|-------------|
| API | `clearform-api` | `clearform-api@<git-sha>` |
| Web | `clearform-web` | `clearform-web@<git-sha>` |

## Alert rules (recommended)

1. **Issues → New issue** — environment `production`, level `error` or `fatal`, notify **Linear** (via Sentry integration).
2. **Issues → Regression** — same environment, notify Linear when a resolved issue reappears.
3. **Performance — AI routes P95 &lt; 10s** (production SLO):
   - Create alert: **p95 transaction duration** exceeds **10s**
   - Filter transactions matching any of:
     - `POST */forms/*/response-quality/evaluate`
     - `POST */forms/*/logic/generate`
     - `GET */analytics/forms/*/ai-insights`
     - `GET */analytics/forms/*/overview`
   - **P50** ~2–3s, **P85** ~5–8s, **P95** &lt;10s (ignore worst 5% tail for SLO)
   - Average latency hides spikes — track P95, not mean
4. Optional: **Performance** p95 on `GET /analytics/forms/:id/performance` if dashboard load regresses.

## Linear

- Team: Clearform
- Include Sentry issue URL in the ticket body (default with Sentry → Linear integration).
- On fix deploy: resolve in Sentry and close Linear with release note.

## After deploy

1. Trigger a test error in staging only, or use Sentry “Send test event”.
2. Confirm a Linear issue appears with the correct project tag.
3. Do not commit `SENTRY_DSN` or Linear API keys to the repo.
