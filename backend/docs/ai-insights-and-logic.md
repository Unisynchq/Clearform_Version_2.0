# AI Insights & form logic (ops + behavior)

## AI Insights — “Rate limit exceeded”

The Analytics tab polls `POST /analytics/forms/:id/ai-insights` every 2.5s while status is `processing`. **Previously**, each poll incremented the per-form Redis counter (8/hour) *before* reading cache — a few polls could exhaust the limit.

**Fix (deploy):** rate limit applies only when starting a **new** generation; cached `ready` / `processing` responses do not count.

**Upstash quota:** VPS logs `ERR max requests limit exceeded` (500k/month) break Bull queues (`bull:ai-insights`, etc.) and Redis cache. Until Upstash is upgraded or the monthly counter resets:

1. Upstash console → enable pay-as-you-go or Pro.
2. Optional: set `AI_INSIGHTS_USE_QUEUE=false` in VPS `.env` (inline generation, fewer Bull polls).
3. Trim old keys: `analytics:insights:*` in Upstash data browser.

## Form logic — always “Next”

`POST /forms/:id/logic/generate` calls NVIDIA NIM. When the model returns **invalid JSON** (common at 400 tokens), the API used to fall back to a **linear** graph (only `kind: "next"` edges).

**Fix (deploy):**

1. NIM: `response_format: json_object`, `max_tokens: 1200`, JSON repair on parse errors.
2. Fallback: **`heuristic_fallback`** — rule-based `if` edges (Rating ≥ 4, choice/text `is_not_empty`, skip-ahead branch) aligned with the frontend `getSuggestedFlowLogic` behavior.
3. Response `meta.source`: `nvidia_nim` | `heuristic_fallback` | `linear_fallback` — check in Network tab after Generate Logic.

Ensure `NVIDIA_NIM_API_KEY` is a real key in VPS `.env` (not placeholder).

## Composio “Dropped Accounts”

Dropped accounts in the Composio dashboard mean OAuth was revoked or never completed. Users must **reconnect** from Share → Sheets/Slack or Profile → Integrations. Workspace entity id is the DB workspace UUID (`f65ea751-...` in your screenshot).

Callback URL must remain: `https://api.clearform.in/api/v1/integrations/callback`
