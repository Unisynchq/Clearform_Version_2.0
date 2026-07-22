# Default owner quality guidance

Seeded in the builder when `customInstructions` are empty. Owner text always wins when present.

## By intent

### identity
Green when they give a real name (first + last when possible). Amber for titles alone. Red for gibberish or greetings.

### project_or_fix
Green when they name what to fix and why. Amber when only a file/module named. Red when unrelated.

### factual_short
Green when they state the fact clearly (number, "none", "0 years", student with no experience). Amber when hedged ("like 3 years"). Never ask for narrative detail on a count question.

### experience_narrative
Green when specific and actionable (what happened, where, outcome). Amber when vague. Red for off-topic. Quote their words. 2/3 facets → green with one tip.

### achievement
Green with measurable impact and role. Amber when thin. Red for repetition or off-topic.

### project_or_fix
Green when they name what to fix and why. Amber when only a file/module named. Red when unrelated.

### generic (fallback)
Green when on-topic with useful detail (impact, stats, example, or emotion). Amber when thin but on-topic. Red for gibberish, repetition, or off-topic. Never ask for an example they already gave.

## Facet clause

When helper text implies facets (measurable impact, contribution, example), append: "Cover: {facets}."
