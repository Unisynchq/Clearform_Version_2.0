# Post-sync performance follow-up

Scope: speed and cost improvements after the backend/frontend sync pass, without changing product behavior or rewriting the AI core.

## What changed in the sync pass

- Response-quality now trusts snapshot-owned guidance for public/respondent traffic, while preserving owner preview for unsaved builder edits.
- AI logic generation now consumes the builder state posted by the frontend instead of silently relying on stale persisted snapshots.
- Form settings updates now evict overview/performance/insights caches so overlay analytics reflects fresh `responseLimit` math immediately.

## First 24-hour checks

Run these before changing any model routing or prompt budgets.

```sql
SELECT
  task,
  provider,
  model,
  count(*) AS calls,
  avg("latencyMs") AS avg_latency_ms,
  percentile_disc(0.95) WITHIN GROUP (ORDER BY "latencyMs") AS p95_latency_ms,
  avg("promptTokens") AS avg_prompt_tokens,
  avg("outputTokens") AS avg_output_tokens
FROM ai_call_logs
WHERE "createdAt" > now() - interval '24 hours'
GROUP BY 1, 2, 3
ORDER BY calls DESC;
```

```sql
SELECT
  task,
  count(*) AS attempts,
  count(*) FILTER (WHERE success) AS success_calls,
  count(*) FILTER (WHERE NOT success) AS failed_calls
FROM ai_call_logs
WHERE "createdAt" > now() - interval '24 hours'
GROUP BY 1
ORDER BY attempts DESC;
```

Use these numbers as the release gate:

- `response-quality/evaluate` p95 should stay under ~1200 ms on the fast path.
- Failed-attempt share should remain low enough that rule fallbacks are the exception, not the norm.
- Overview loads should show fresh response-target math immediately after `PATCH /forms/:id/settings/response-limit`.

## Priority backlog

1. Verify the fast path before moving more tasks to Gemini-first.
   Keep `GEMINI_TASKS=fast` until `ai_call_logs` shows stable latency and low failed-attempt share for at least 2-3 days. Only then consider `GEMINI_TASKS=fast,logic,insights`.

2. Measure cache effectiveness before trimming prompts.
   The biggest cheap win is cache reuse, not more prompt surgery. Confirm that response-quality cache keys are hot for repeated keystrokes and that overview cache invalidation now behaves correctly after settings changes and new responses.

3. Add a timeout-based memory skip only if p95 regresses.
   `docs/ai/backend-system-flow.md` already calls this out as remaining work. If p95 rises, prefer a bounded timeout around memory/RAG retrieval so the request falls back to snapshot-only context rather than paying the full tail latency.

4. Watch fallback ladders by task, not just globally.
   Split monitoring for `fast`, `logic`, and `insights`. `logic` and `insights` have longer timeouts and should not be tuned using keystroke-path assumptions.

5. Tune fallback breadth before touching doctrine.
   If logs show repeated LiteLLM/OpenRouter churn, reduce fallback fan-out per task before changing any doctrine text. This cuts tail latency without changing product copy.

6. Re-check overview and insights TTLs only after real traffic.
   Current TTLs are acceptable now that invalidation exists. Shorten them only if users still see stale analytics under normal usage.

## Low-risk implementation options

- Add a lightweight counter or log field for quality cache hits/misses if Redis hit rate is still opaque during incident review.
- Add a separate alert for `GET /analytics/forms/:id/overview` latency and stale-cache complaints, since overlay usage is now more sensitive to response-limit updates.
- If `logic` remains mostly heuristic/linear fallback in practice, inspect snapshot completeness first; do not compensate with broader prompt changes.

## Do not do yet

- Do not rewrite doctrine or loosen response-quality standards to chase latency.
- Do not move all tasks to larger Gemini models before the current fast path is observed in production.
- Do not remove fallbacks; the current ladder is a reliability feature, not waste.
