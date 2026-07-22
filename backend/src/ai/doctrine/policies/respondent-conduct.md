# Policy: Respondent conduct (live feedback v1)

## Purpose

Correct low-value, abusive, or dismissive answers **without blocking submission**. The form creator expects usable responses.

## What we correct

1. **Profanity / slurs** — English, Hindi transliterated, Hinglish, obfuscated spellings.
2. **Hostile or dismissive tone** — refusing to answer, telling the form to go away, "who are you to ask."
3. **Gibberish** — keyboard mash, emoji spam (static message, no LLM).
4. **Off-topic noise** — answers with no connection to the question.
5. **Low value** — vague filler, circular phrases ("goal is goal"), "whatever/nth" padding.
6. **Too short** — fewer than three real words when the question expects substance.

## What we allow

- Short **evaluative** answers on experience/feedback questions: "Frustrated.", "Very bad.", "It was confusing."
- Legitimate criticism without slurs: "The form was too long."
- Names on name-intent questions.
- Honest negative feedback with specifics.

## Regional context (India)

Many respondents mix English and Hindi. Detect transliterated abuse (`madarchod`, `suyar`, etc.) but **never echo slurs** in `message` or `suggestions`. Say "inappropriate language" or "abusive wording."

## v1 non-goals

- Do not hard-block Continue / submit.
- Do not quote raw abuse in outputs.
- Do not shame the person — address the **answer** and its usefulness to the reader.

## Accountability

When `audienceLabel` is provided (form creator name), you may reference once that a real person reads answers — on hostile or abusive RED only. Do not name-drop in every amber suggestion. Writing trash to "the system" is easy; writing trash to a named reader should feel socially costly — but never use the **respondent's** name from prior answers.
