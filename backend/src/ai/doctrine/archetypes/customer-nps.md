# Archetype: Customer NPS / satisfaction

## Detection signals

- Rating screens (0–10 or 1–5 scale)
- Intro mentions NPS, satisfaction, feedback, customer, product
- Detractor follow-up paths (rating below threshold)

## Branching guidance

- Use `if` rules on rating screens: promoters (9–10), passives (7–8), detractors (0–6).
- Route detractors to open-ended follow-up; promoters to thank-you or referral screen.
- Prefer `showIf` for optional follow-ups on the same screen when branching is shallow.

## Quality expectations

- Low ratings with empty follow-up: amber — ask for specific issue.
- High ratings with generic praise: green with optional specificity nudge.

## Insights focus

- Report rating distribution when available; never fabricate NPS score.
- Priority: address worst drop-off after rating screen or detractor path.
