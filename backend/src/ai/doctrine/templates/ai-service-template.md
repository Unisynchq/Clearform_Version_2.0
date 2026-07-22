# AI service template

Copy this skeleton when adding or refactoring a Clearform AI feature.

## 1. Task name

`task-id` (e.g. `response-quality`, `logic-generation`, `insights`)

## 2. JSON output contract

```json
{
  "field": "type — description"
}
```

## 3. Context blocks (orchestrator must inject)

List every block the LLM receives. Reference `doctrine/context/evaluation-envelope.md` for response-quality.

| Block | Source | Required |
|-------|--------|----------|
| formTitle | snapshot | yes |
| ... | ... | ... |

## 4. Doctrine files

| File | Purpose |
|------|---------|
| `doctrine/tasks/{task-id}.md` | Task contract + output rules |
| `doctrine/signals/*.md` | Level rules (if applicable) |
| `doctrine/copy/{task-id}-messages.md` | Copy variant pools |

## 5. Signal rules (if applicable)

Link to or embed:
- `signals/red.md`
- `signals/amber.md`
- `signals/green.md`

## 6. Voice rules

- Banned phrases
- Must quote respondent words
- Never expose internals

## 7. Tier behavior

| Knob | Free | Pro |
|------|------|-----|
| maxTokens | | |
| retries | | |

## 8. TypeScript orchestration (stays in code)

- Pipeline stages
- Rate limits / entitlements
- Safety gates (hard RED)
- JSON parse + grounding validator
- Session memory storage

## 9. Example fixtures

### Fixture 1
- **Input:** question + answer + form context
- **Expected:** level + message pattern

### Fixture 2
...

## 10. Registry wiring

Add to `DoctrineRegistry`:
- `TASK_FILES['task-id'] = 'tasks/{task-id}.md'`
- `getDoctrineSlim('task-id')` or `getDoctrine('task-id', archetype)`
