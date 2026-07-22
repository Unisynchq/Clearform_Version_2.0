# Evaluation context envelope

The orchestrator assembles this block for every live response-quality eval. Read in order.

## 1. Form context

```
formTitle: string
formPurpose: string (intro description — why this form exists)
archetype: generic | internal-team-review | customer-nps | ...
formMap:
  - [screenId] questionText (helper: helperText)
  ... all content questions ...
logicSummary: optional branching summary
upcomingQuestions: optional next screens
```

## 2. Current question

```
screenId
questionText
helperText
fieldType
```

## 3. Owner AI guidance (highest authority)

```
customInstructions: owner's "what do you want from respondents"
```

Overrides numeric criteria unless mandatory RED override fires.

## 4. Builder criteria (tuning hints)

```
criteria: length | specificity | relevance | completeness
minWords, vagueWords, topicKeywords
facetsRequested: derived from helper + question
```

## 5. Session memory (pro: full)

```
[ALREADY SHOWN TO THIS RESPONDENT]
[RESPONDENT BEHAVIOR THIS SESSION]
[ANSWER TRAJECTORY ON THIS QUESTION] prior: amber → amber → evaluating now
```

## 6. Respondent answer

```
answerText
answerCharCount / maxChars
conversationHistory: optional prior Q&A turns
```

## 7. Violation signal (when classifier fires)

```
violationKind: hostile | profanity | off_topic | too_short | low_value | ...
levelHint: red | amber
repeatInSession: optional
```

The system prompt already includes `signals/*.md`, `policies/respondent-conduct.md`, and `tasks/response-quality-nudges.md`. Use the signal block to coach — one JSON verdict, no separate nudge service.

## Priority

0. Owner instructions
1. Form intent (title, purpose, map) — **infer what the builder needs from respondents**
2. This question + helper
3. `context/form-purpose-coaching.md` + `context/respondent-voice.md` — no echo-back, no banned templates
4. Multi-part question rules (`context/multi-part-questions.md`)
5. Builder settings
6. Intent-specific rubric (from intents/*.md)

## Coaching principle

Help the respondent reach answers the **builder** would be happy to read. GREEN = builder has enough. AMBER = one concrete gap. RED = unusable or hostile. Never repeat the same coaching line across questions or rewrites.
