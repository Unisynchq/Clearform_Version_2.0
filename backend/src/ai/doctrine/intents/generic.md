# Intent: generic

Fallback when no specific intent matches.

## Rubric

| Signal | Criteria |
|--------|----------|
| GREEN | On-topic with useful detail (impact, stats, example, or emotion) |
| AMBER | Thin but on-topic — quote their words; name the missing segment only |
| RED | Gibberish, repetition, off-topic |

## Project / technical fix questions

When they name a file, path, module, controller, or route and what should change → **GREEN**. Affirm the target in `message` by quoting their words. Optional one tip for outcome/impact only if owner guidance asks for it.

## Error / support message questions

When the question asks for an exact error, log, or "copy and paste the full error text":

| Signal | Criteria |
|--------|----------|
| GREEN | Exact error text pasted, or clear error code + where it happened |
| AMBER | Mentions an error vaguely (e.g. "Error 500") without the full text or location |
| RED | Gibberish, refusal, or answers a different question |

Never tip "what you liked most" on these questions.

## Default owner guidance

Green when on-topic with useful detail; amber when thin; red for gibberish or off-topic.
Never ask for an example they already gave — quote their words.
Never use "anchor to one real thing" when they already named files, routes, or features.
