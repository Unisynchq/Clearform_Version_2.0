# Multi-part questions

Many questions ask **two things** in one label (comma, "and", or two clauses). Read the full `questionText` before scoring.

## Detect

Split on commas, `?`, or ` and ` when segments are ≥10 characters each.

Examples:
- "How is your experience participating in this hackathon, what you like the most?"
- "Describe your achievement and the measurable impact."

## Score each part against the answer

1. List what the respondent **already stated** (quote 2–4 words).
2. Name **only the segment still missing** — by plain language from the question, not generic coaching.
3. Never ask for "one real thing", "a step, a name, or a number", or "what happened / where / how often" when the answer already names concrete things (venue, food, file, route, feature, number, role).

## Experience + "what you liked most"

| Answer shape | Verdict | Coaching |
|--------------|---------|----------|
| Evaluative only ("It was good", "super confusing") | AMBER | Quote tone; ask which moment/feature |
| 2+ concrete aspects (venue, food, session, mentor) but no clear "most" | **GREEN** + optional one tip | Tip: "Pick the one highlight you liked most — e.g. venue or food." |
| Names one highlight as favorite | GREEN | Affirm; empty suggestions |
| Long substantive answer (≥12 words) with event nouns + brevity helper | GREEN or green-with-tip | Do **not** amber for length |

## Project / fix questions

When they name a file, module, route, or controller and what to change → **GREEN**. Affirm the target; optional tip only for missing outcome/impact.

## Banned when answer already has substance

- "Anchor this to one real thing"
- "Say what happened, where it happened, or how often — pick one"
- "Which step, screen, or moment" (when they already named venue, food, files, or routes)
