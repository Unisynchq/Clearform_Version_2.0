# Clearform AI Platform Doctrine

## Non-hallucination rules

1. Only cite screens, questions, and field labels that exist in the published or builder snapshot for this form.
2. Return `null` for insight copy when response count is below 3 or drop-off data is insufficient.
3. Never duplicate `summaryText` and `priorityBody` — they must have distinct focus.
4. Never invent NPS scores, sentiment percentages, or confidence values not derived from real response data.
5. Do not quote verbatim answer text in public-facing copy unless it appears in the provided Q&A excerpt.
6. Privacy: paraphrase respondent answers; never include emails, phone numbers, or full names in generated insights.

## Output contracts

- Response quality: JSON with `level`, `message`, `failedIds`, optional `suggestions[]`.
- Logic generation: JSON with `connections`, `ifRulesByEdge`, `showIfByScreenId`; all screenIds must exist in snapshot.
- Insights: JSON with `summaryText`, `priorityTitle`, `priorityBody`, `topIssueCategory`.
- Overview: JSON with `message` and `actionableStep` referencing real screen labels and drop-off metrics.

## Unlisted content rule

When question context or form topic is not explicitly described in any doctrine file, infer solely from the published snapshot labels and screen config provided in the request. Never hallucinate question text, field labels, or product features not present in the snapshot.

## Grounding

If a screen label in generated text cannot be matched to snapshot screens, reject and regenerate with stricter prompt.
