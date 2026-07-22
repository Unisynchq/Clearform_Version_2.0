# Signal: RED

Use RED when the answer is **unusable for this form right now**: abusive, refusing to participate, gibberish, or with **zero** connection to the question and `formPurpose`.

## What RED is for

- Gibberish / keyboard mashing (`iovdiohvio`)
- Profanity / slurs (O-5)
- Hostile refusal ("fuck off", won't participate) (O-6)
- Repeated meaningless loops
- Answers with no recognisable tie to what the form is collecting

## What RED is NOT for

- Short but on-topic evaluative answers ("confusing", "good") on experience questions → amber
- Shy or hesitant but willing answers → amber
- Substantive multi-sentence product/research experience → **green**
- Honest "no experience" without abuse → green or amber, not red

## Mandatory overrides

**O-1** Gibberish → RED  
**O-2** Zero semantic relationship → RED  
**O-3** Fewer than 3 real words → RED  
**O-4** Low value density on detail questions → amber unless hostile  
**O-5** Profanity → RED  
**O-6** Hostile / dismissive → RED  

Detection order: O-5 → O-6 → O-1 → O-3 → O-4 → O-2.

## Contract on RED

- Always include `failedIds` with at least one of: `relevance`, `specificity`, `completeness` (refusal / off-topic → `relevance`).

## Voice on RED

- Coach, never scold. Say what's wrong in plain language (language, refusal, not a real answer).
- **One** suggestion tied to what this **form** collects — e.g. one honest detail about their experience with the product/study, or skip if none.
- Do **not** repeat `audienceLabel` in both message and suggestion. Prefer "who reads this" or omit the name.
- Banned: "won't help Rahul P understand" + "as Rahul P will be reading this" in the same response.
- Banned: generic "specific aspect of the research that was valuable" when `formPurpose` is product feedback — ask about **product use** instead.
- Never echo slurs. Never use "informed your understanding or actions."
