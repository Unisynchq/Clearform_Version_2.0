# AI Cost & Capacity Model

Verified pricing (ai.google.dev/gemini-api/docs/pricing, 2026-07-02), USD per 1M tokens:

| Model | Input | Output | Used for |
|---|---|---|---|
| gemini-2.5-flash-lite | $0.10 | $0.40 | Free tier — quality eval, nudges |
| gemini-2.5-flash | $0.30 | $2.50 | Pro tier — quality eval, insights |
| gemini-2.5-pro | $1.25 (≤200k) | $10.00 (≤200k) | Pro tier — logic generation only |

## Per-call assumptions (replace with real `ai_call_logs` averages after 3 days of traffic)

```sql
SELECT model, count(*), avg("promptTokens") AS avg_in, avg("outputTokens") AS avg_out,
       avg("latencyMs") AS avg_latency
FROM ai_call_logs
WHERE success AND "createdAt" > now() - interval '3 days'
GROUP BY 1 ORDER BY 2 DESC;
```

- Quality evaluate: ~1,800 input / ~130 output tokens (slim doctrine + form map ≤12 questions + logic summary ≤15 edges + owner guidance ≤600 chars + answer).
  - flash-lite ≈ **$0.00023/eval** · flash ≈ **$0.00087/eval**
- Keystroke volume: 400 ms debounce + abort-on-retype + Redis cache ⇒ ~3 evals per answered text question. A form with 4 scored text questions ⇒ ~12 evals/response.
- Per completed response: free ≈ **$0.003**, pro ≈ **$0.010**.

## Per-user lifetime AI cost

| | Free (50 responses) | Pilot (300 responses) |
|---|---|---|
| Quality evals | ~$0.14 | ~$3.10 |
| Logic generation (~20 gen, pro model) | — (cheap/free models) | ~$0.15 |
| AI insights + overview | rule-based | ~$0.20 |
| **Total AI COGS** | **~$0.14** | **~$3.50 (≈10% of $34.99)** |

## Capacity

- **$100/month Gemini budget** ≈ ~430k flash-lite evals (≈36k free-tier responses) **or** ~115k flash evals (≈9.5k pro responses) — comfortably hundreds of active pilots.
- Worst-case burst is capped by `FormAiRateLimitService` (free 60/min/form, pro 300/min/form) ⇒ single hostile form ≈ $0.02/min free, $0.26/min pro.

## Guardrails in code

- `AI_DAILY_BUDGET_USD` (env) — global daily circuit-breaker in `llm-gateway.service.ts`: estimated spend is accumulated per-day in Redis (`ai:spend:YYYY-MM-DD`); past the cap, `completion()` returns null and every surface falls back to rule-based results until midnight UTC. Suggested starting value: `10`.
- Latency budget: keystroke path uses `getDoctrineSlim`; caps — form map 12 questions, owner guidance 600 chars, logic summary 15 edges. Target p95 < 1.2 s on flash-lite (`latencyMs` in `ai_call_logs`).

## Ops checklist after deploy

1. Confirm Gemini is serving: `SELECT provider, model, success, "latencyMs" FROM ai_call_logs ORDER BY "createdAt" DESC LIMIT 50;` — expect `gemini` + `success=true` rows; investigate if rule-fallback share > ~20%.
2. To route logic/insights to Gemini too (recommended once observed stable): set `GEMINI_TASKS=fast,logic,insights` on the VPS `.env` and `pm2 reload`.
3. Optional: `GEMINI_MODEL_LOGIC_PRO=gemini-2.5-pro` is the default for paid-tier logic; override only to downgrade.
