# Clearform AI — skill index

Runtime doctrine for all LLM-backed **user services** lives in **`src/ai/doctrine/`** (markdown). TypeScript under `src/ai/` is wiring only: routes, pipeline stages, gateways, caches, and fast safety classifiers.

**Cleo** (`src/ai/cleo/`) is separate — passive internal Jarvis on the VPS (read-only DB, Qdrant). Cleo does not generate live respondent coaching.

## User-facing services (doctrine → LLM)

| Service | Doctrine task | API / entry |
|---------|---------------|-------------|
| Live response quality | `tasks/response-quality.md` + signals + nudges | `POST .../response-quality/evaluate` |
| Improve instructions | `tasks/improve-instructions.md` | `POST .../improve-instructions` |
| Logic generation | `tasks/logic-generation.md` | `POST .../logic` |
| Insights / overview | `tasks/insights.md`, `overview.md` | analytics routes |

## Response quality — what each file does

| File | Role | Judgment? |
|------|------|-----------|
| `doctrine/*.md` | Rules, intents, copy variants, tasks | **Yes — source of truth** |
| `doctrine.registry.ts`, `copy.registry.ts` | Load `.md` into prompts | No |
| `ai-quality-rules.util.ts` | Violation **classifier** + gibberish gate | Signals only — not coaching copy |
| `question-signals.util.ts` | Question/answer overlap, stutter, excerpts | Signals for classifier + prompts |
| `quality/pipeline/*.stage.ts` | Cache → context → intent → violation → LLM → finalize | Orchestration only |
| `ai-quality.util.ts` | Prompt assembly, JSON parse, sanitize output | No rewrites of LLM copy |
| `respondent-copy.util.ts` | Sanitize owner-leak, perfection-tip filter | Hygiene only |
| `guidance-clause.util.ts` | Filter junk owner directives (improve-instructions) | No scoring |
| `grounding-validator.service.ts` | JSON shape / hallucination guards | No scoring |
| `llm-gateway.service.ts` | Provider routing, tokens, observability | No |
| `ai-feedback.*` | Builder thumbs-down → Cleo learning | No live coaching |
| `form-logic-heuristic.util.ts` | **Logic generation** heuristic fallback | Separate service — not response-quality |

**Removed from live path** (do not reintroduce): `evaluateQualityRuleBased`, `semantic-adequacy.util`, `near-complete.util`, `adequacy.stage`, Cleo nudge on live eval.

## Other AI services (same pattern)

Each service gets a `doctrine/tasks/<service>.md` task file. TypeScript wires context + LLM call + JSON validation. Heuristic fallbacks in `ai-orchestrator.service.ts` (logic, insights) are candidates for the same “LLM or clear error” treatment when those services are tackled.

## Cleo (internal — not user-facing)

See `src/ai/cleo/SKILL.md`. Nightly read-only observation + builder correction learning → Qdrant/pgvector.

## Editing AI behavior

1. Change **`.md`** under `src/ai/doctrine/`
2. Restart API (doctrine version hash busts caches)
3. Touch TypeScript only for new routes, context blocks, or infrastructure

## Tests

```bash
npm test -- quality-pipeline.golden.spec.ts
npm test -- ai-quality-rules.util.spec.ts
```
