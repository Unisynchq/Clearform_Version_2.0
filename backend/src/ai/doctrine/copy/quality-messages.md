# Quality message copy

Static respondent-facing copy for the response-quality pipeline. Headings are
keys, bullets are variants — the registry picks a variant deterministically
per (question, answer) and skips variants a respondent has already seen.
`{{var}}` placeholders are interpolated by the caller.

Editing rules:
- Every key keeps at least 2 variants (repeat-avoidance needs choice).
- A string used under `green.*` must never appear under `amber.*`, `red.*`,
  or `violation.*` — and `amber.*` never overlaps `red.*`. A spec enforces this.
- `violation.*` keys have their level decided at runtime (mid-typing softens
  red → amber), so they carry no level prefix.
- `.repeat` variants are used when the same violation happens again in one
  respondent session — they must reference that it happened before.

## green.default

- Nice — this is clear and easy to act on.
- Good detail — that’s genuinely helpful.
- Concrete answers like this make a real difference.
- That gives a clear picture to work with.

## green.name_complete

- Thanks — {{excerpt}} works as a name here.
- Got it — {{excerpt}} is clear enough.

## green.artifact_named

- You pointed at {{excerpt}} — that helps narrow it down.
- Naming {{excerpt}} is a solid start for this question.

## green.project_specific

- Clear — {{excerpt}} tells us what to fix.
- That’s actionable: {{excerpt}} gives a concrete target.

## green.near_complete

- Strong start on "{{excerpt}}" — add {{missingFacet}} to make it complete.
- You covered most of this — {{missingFacet}} would round it out.

## amber.guidance_unverified

- You're close — add the part of the question you haven't answered yet.
- Almost there — one more specific detail would complete this.

## amber.not_configured

- A little more detail would make this answer easier to use.
- You could add one more specific detail when you’re ready.

## amber.generic_incomplete

- What happened, exactly? One specific moment makes this useful.
- You’re close — add the one detail someone would need to act on this.

## amber.length

- When you’re ready, try at least {{minWords}} words for a fuller answer.
- A slightly longer answer helps — around {{minWords}} words is a good target.

## amber.specificity

- Try swapping a general word for one concrete example.
- One specific detail or example would strengthen this.

## amber.relevance

- This seems a little off-topic — try tying it back to the question.
- Bring this back to what the question is asking.

## amber.completeness

- Looks like the thought stops midway — finish the sentence when you can.
- You could round this off with a complete sentence.

## amber.fallback

- Tie this answer to what this question is asking — one concrete detail.
- Name the missing piece of this question in one short sentence.

## suggestion.default

- Answer this question with one concrete detail the builder can use.
- Add the specific detail this question asks for — nothing else.

- Stay on this question — one short, usable fact or example.
- Give one on-topic detail that matches the question text.

## violation.pure_gibberish

- This doesn't look like a real answer. Please write a genuine response to the question.
- That reads as random characters — a genuine answer is needed here.

## violation.pure_gibberish.repeat

- Random characters again — earlier answers had the same problem. A real answer here matters.
- This is the same keyboard-mashing as before. Please write a genuine response this time.

## violation.profanity

- Inappropriate language won't help {{reader}} — this answer has no value yet.
- That language doesn't give {{reader}} anything to work with.

## violation.profanity.repeat

- Inappropriate language again — {{reader}} still gets nothing from this. A plain answer works better.
- Same problem as before: drop the language and give {{reader}} a real answer.

## violation.hostile_dismissive

- That pushes back on the question instead of answering it.
- This dismisses the question rather than answering it.

## violation.hostile_dismissive.repeat

- Still pushing back instead of answering — one honest sentence is all this needs.
- Like before, this refuses the question. A short real answer helps more.

## violation.off_topic

- Your answer doesn't address what was asked.
- This answers a different question than the one being asked.

## violation.off_topic.repeat

- Off-topic again — take a second look at what this question is actually asking.
- Like your earlier answer, this doesn't address the question that was asked.

## violation.too_short

- A bit short still — add a sentence or two when you’re ready.
- Almost there — a little more detail would make this useful.

## violation.too_short.repeat

- Still quite brief — as before, a sentence or two would help.
- A little more detail would help, like your earlier answer — one full sentence is enough.

## violation.low_value

- This is too vague to act on.
- There's nothing concrete here yet for the form owner to use.

## violation.low_value.repeat

- Still too vague, like your earlier answer — one specific detail fixes that.
- Same as before: without a concrete detail this can't be acted on.

## violation.prompt_injection

- Please answer the question directly.
- Just answer the question in your own words.

## violation.default

- Please improve your answer.
- This answer needs another pass.

## suggestion.gibberish

- Replace random characters with a short, real answer to the question.
- Delete the random characters and write one real sentence instead.

## suggestion.hostile.goal

- Share one honest goal in plain language — skip insults.
- Name one real goal you care about, without the attitude.

## suggestion.hostile.experience

- What one thing about this form was confusing or frustrating?
- Name the single most annoying part — that's genuinely useful feedback.

## suggestion.hostile.default

- Rewrite without insults — one sentence that answers the question.
- Drop the pushback and give a one-sentence answer.

## suggestion.low_value.goal

- Name one specific goal (career, health, family) you are working toward.
- Pick one area — career, health, family — and name a goal in it.

## suggestion.low_value.default

- Replace vague words with one concrete detail from your experience.
- Add one specific example — a step, a name, or a number.

## suggestion.off_topic

- Answer "{{question}}" in your own words.
- Re-read "{{question}}" and respond to that directly.

## suggestion.too_short

- Write at least a few words that directly answer the question.
- Add a sentence that directly answers what was asked.
