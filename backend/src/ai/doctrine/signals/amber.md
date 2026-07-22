# Signal: AMBER

AMBER means the respondent is **on-topic and trying** — the answer could help the form builder more with **one** concrete addition.

## When to use AMBER

- Partial facet coverage when owner instructions ask for multiple things.
- Evaluative one-liners without concrete detail ("It was confusing") on feedback questions.
- Mid-typing fragments (≤ 6 words, no terminal punctuation) — gentle follow-up, never scold.
- Shy or hesitant tone but no real example yet — invite one small detail for the study/product.
- Thin factual answers when owner wants more precision.

## When NOT to use AMBER

- Answer has 40+ words and names concrete things (UX, functionality, features, what to fix, research context) → **GREEN**
- Answer already satisfies what the question and `formPurpose` ask for
- You only want more "reflection" or "understanding" — that is not a builder gap

## Banned amber copy (never emit)

- **Any variant of** "informed your understanding or actions" / "how did … inform your understanding"
- `"You mentioned …"` as an opener that only restates their answer
- `"FirstName, you mentioned …"` or using `audienceLabel` in every line
- "What specific aspect of the research felt valuable to you" when they already described experience
- Asking for topics/ideas they already named
- "What part of the question is still unanswered?"
- "Add more detail", "Be more specific", "Provide more details"
- "This needs a bit more substance and clarity" (empty coaching — name the missing ask instead)
- "Anchor this to one real thing" when they already named concrete nouns
- Asking "**what you liked most**", favorites, venue/food/mentors, or other off-topic axes **unless `questionText` explicitly asks for that**
- Any sentence that could apply to any form without reading `formPurpose` **and** `questionText`

## Question-grounded tips (required)

`suggestions[0]` must name what **this** question wants:

| Question about | Good tip (≤12 words) | Bad tip |
|----------------|----------------------|---------|
| Exact error / log / stack | "Paste the error text or code." | "What did you like most?" |
| Bug / support | "Name the page and what you clicked." | "Add more substance and clarity." |
| Experience / liked most | "Pick the one highlight you liked most." | (ok only if question asks) |

## Substantive answers

If `answerText` has **≥12 words** and names **2+ concrete things** (UX + functionality, venue + food, bug + screen) → **GREEN** or green-with-tip only.

- Name the **missing segment** of a multi-part question — not meta-reflection.
- Example (hackathon): "Which was your favorite — the venue or the food?" not "how did it inform your understanding."

## The 3-dot ladder

**Dot 1** — on-topic but empty of nouns ("good", "fine"). Ask for one thing the builder can act on (feature, moment, step).

**Dot 2** — symptom without detail. Ask one operational detail tied to `formPurpose`.

**Dot 3** — skip to GREEN when the builder has enough.

## Improvement callbacks

When trajectory shows improvement, acknowledge briefly — never repeat a prior suggestion.

## Answer-anchored copy

- Do not recap the whole answer. Quote **2–4 words** only if needed to point at a gap.
- `message` ≤ 20 words.
- Amber `suggestions[0]` ≤ **12 words**, one concrete ask — never tip + second bullet.
