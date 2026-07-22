# ADR: Form intent capture and response quality ranking (research track)

**Status:** Proposed — not implemented in current sprint  
**Date:** 2026-06-12  
**Owners:** Product + backend AI platform

## Context

Form builders need better data quality than raw completion counts. Constitutional AI already evaluates answers per question; the next step is capturing **why** a form exists and surfacing **ranked** responses in Analytics without deleting low-quality rows.

## R1 — Form intent (`settings.formIntent`)

Store on publish snapshot (and builder draft):

```json
{
  "settings": {
    "formIntent": {
      "audience": "University students in HCI course",
      "decision": "Whether to shorten the incentive survey",
      "greatResponseLooksLike": "Specific steps, frustrations, and outcomes — not generic praise",
      "capturedAt": "2026-06-12T00:00:00.000Z"
    }
  }
}
```

**UI (future):** 2–3 questions in publish modal or pre-publish step.  
**AI:** `FormContextService` injects `formIntent` into `purpose` line for response-quality, insights, and overview. Archetype detection may use `templateId` + `formIntent.decision`.

## R2 — Response quality ranking (Responses tab)

**Persist per screen on submit** (extend `FormResponse.payload` or columns):

```json
{
  "qualityByScreenId": {
    "12": {
      "level": "amber",
      "failedIds": ["specificity"],
      "suggestions": ["Mention which step felt slow."],
      "scoredAt": "ISO-8601"
    }
  },
  "aggregateLevel": "amber"
}
```

**Analytics UI (future):** Filter chips — High value / Needs review / Low effort — no deletion.  
**Depends on:** unified orchestrator path (`finalizeQualityResult`) already used for live eval; post-submit processor should write the same shape.

## Non-goals (this ADR)

- No builder UI in this sprint  
- No migration of historical responses without quality metadata  
- No auto-deletion of low-quality answers

## Acceptance when implemented

1. Republish with `formIntent` → AI insights mention audience/decision in summary.  
2. Responses tab filters by `aggregateLevel` without hiding rows.  
3. FormContext includes `formIntent` in quality eval user prompt (never shown to respondents).
