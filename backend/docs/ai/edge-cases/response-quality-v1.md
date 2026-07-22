# Edge cases: Response quality v1 (Cleo nudges)

Regression fixtures for live `POST /forms/:id/response-quality/evaluate`.

## Profanity / abuse

| Input | Expected kind | Notes |
|-------|---------------|-------|
| "My goal is fuck" | profanity | Not gibberish copy |
| "Fuck you" | hostile_dismissive or profanity | Not "too short" |
| EN+HI mixed abuse on life goal | profanity | Hindi transliteration list |
| "Very bad .. fucking asshole" on experience Q | profanity | Constructive anger without slurs is different |
| Obfuscated `f@ck` | profanity | Collapse obfuscation |
| "assassin" | none | Substring allowlist |

## Hostile / dismissive

| Input | Expected kind |
|-------|---------------|
| "Who are you to ask me this" | hostile_dismissive |
| "None of your business" | hostile_dismissive |
| "I don't want to answer" | hostile_dismissive |

## Gibberish

| Input | Expected kind |
|-------|---------------|
| 77-char mash string | pure_gibberish |
| "need to fnkjewdb..." | pure_gibberish |
| Long mash, not too_short | pure_gibberish wins over length |

## Low value / filler

| Input | Expected kind |
|-------|---------------|
| "Goal is goal and fine is life" | low_value |
| "astronaut... nth... whatever" | low_value |
| "Not much ..it's good" on experience Q | low_value |
| Must not return green | false-green guard |

## Valid short answers

| Input | Expected kind |
|-------|---------------|
| "Frustrated." on improvement Q | none |
| "It was confusing." | none |
| "Very bad" (no slur) on experience Q | none or low_value |

## Experience / feedback v2 (intent-first)

| Question | Answer | Expected signal | Notes |
|----------|--------|-----------------|-------|
| How is your experiance with filling this form | It was super confusing | amber (not off_topic) | Typo `experiance` must still match experience intent |
| Same | Fucking asshole experiance | profanity RED | Unchanged abuse path |
| Experience Q + helper "as much or as little as you'd like" | It was super confusing | amber or green, never RED | Brevity helper caps penalty |
| How is your experience filling out this form? | Not much ..it's good | amber | Evaluative but thin |

## Off-topic

| Input | Expected kind |
|-------|---------------|
| "red blue green yellow" | off_topic |
| "nothing and whatever and nth" | low_value or off_topic |

## Tier / perf

- Free: 1 suggestion, 4s nudge timeout
- Redis cache keyed by answer hash
- Gibberish: zero LLM calls

## Privacy

- Logs and Sentry must not include raw slurs
- Nudge outputs never echo slurs verbatim
