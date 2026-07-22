# Cleo — internal Jarvis (passive)

Cleo is **not** a user-facing AI product. Cleo is Clearform's under-the-hood operator on the VPS:

- **Passive** — reads the database and observability tables; never mutates core form/response data
- **Connected to Qdrant** — stores distilled platform observations and learned calibration rules
- **24/7** — nightly (and on-demand) jobs via Bull `cleo-learning` queue
- **Purpose** — understand whether builders and respondents are getting the outcomes they expect; surface error patterns and calibration gaps

## What Cleo does NOT do

- Does **not** generate live respondent coaching copy (that is `response-quality` LLM + `src/ai/doctrine/`)
- Does **not** block or alter API requests in the hot path
- Does **not** replace doctrine markdown as the LLM's source of truth

## Components

| File | Role |
|------|------|
| `cleo-jarvis.service.ts` | Read-only system observer (failures, feedback, usage patterns) |
| `cleo-learning.service.ts` | Distils builder thumbs-down into pgvector + Qdrant rules |
| `qdrant-memory.service.ts` | Platform rule vector store |
| `cleo.processor.ts` | Bull worker: learning → jarvis observation |
| `cleo-scheduler.service.ts` | Nightly cron (20:00 UTC) |

## Data flow

```
ai_call_logs (read)     ─┐
ai_feedback (read)      ─┼→ CleoJarvisService → Qdrant observations
form responses (read)   ─┘

ai_feedback rating=-1   → CleoLearningService → pgvector + Qdrant rules
```
