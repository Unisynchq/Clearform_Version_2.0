# Scale and degradation doctrine

## Stateless workers

- Each AI request is independent; no in-process session state.
- Form-scoped context is rebuilt from Postgres + Redis on every call.
- Doctrine version is cached in Redis; reload on deploy hash change.

## Token budgets

| Task | Max context excerpt | Max output tokens |
|------|---------------------|-------------------|
| response-quality | 800 chars answer + question | 220 |
| logic-generation | All screens JSON (truncate fields to 5 per screen) | 1200 |
| insights | 12 Q&A pairs, 120 chars each | 500 |
| overview | Drop-off top 3 + stats line | 200 |

## Degradation ladder

1. LiteLLM (Ollama local) → OpenRouter free models
2. On LLM failure or grounding reject: rule-based heuristics
3. Under load (LLM timeout): skip RAG memory retrieval; use snapshot-only context
4. Insights with &lt; 10 responses: return `insufficient_data` without LLM call

## Form-scoped isolation

Memory chunks, rate limits, and cache keys are always keyed by `formId`. Never mix context across forms.
