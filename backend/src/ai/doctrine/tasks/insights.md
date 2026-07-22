# Task: AI insights (B.12)

> Doctrine stack: `constitution.md` → `platform.md` → archetype → this file.  
> Context envelope: form analytics, Q&A excerpts, drop-off metrics.  
> Template: `src/ai/doctrine/templates/ai-service-template.md`

## Contract

Return JSON only:

```json
{
  "summaryText": "...",
  "priorityTitle": "...",
  "priorityBody": "...",
  "topIssueCategory": "..."
}
```

## Rules

1. `summaryText`: 2–4 sentences citing themes from verbatim answers in the excerpt.
2. `priorityBody`: one paragraph with a **different** focus than `summaryText` — specific next step.
3. `priorityTitle`: short actionable headline (not a duplicate of summary opening).
4. Reference real screen labels from drop-off data when citing abandonment.
5. Never duplicate `summaryText` in `priorityBody` (hard reject).
6. `confidencePercent` is derived from response count: ≥25 → 85, ≥15 → 72, ≥10 → 58, else null.
7. Do not invent NPS or fake sentiment scores.

## Insufficient data

With fewer than 10 responses, do not call LLM; return `insufficient_data` status.
