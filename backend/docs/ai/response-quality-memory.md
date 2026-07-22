# Response quality & Best Responses — session memory

Last updated: **2026-07-05** (Jul 2026 founder/user testing sprint)

Use this when resuming work on live answer feedback (yellow/amber/green), Improve with AI, or Analytics → Best Responses. **Do not re-litigate architecture** — we added thin layers on top of the existing pipeline.

Related docs:

| Doc | Purpose |
|-----|---------|
| [`doctrine/tasks/response-quality.md`](./doctrine/tasks/response-quality.md) | LLM system doctrine (edit for behavior, not form-specific hacks) |
| [`doctrine/tasks/improve-instructions.md`](./doctrine/tasks/improve-instructions.md) | Improve-with-AI owner prompt polishing |
| [`doctrine/tasks/best-responses.md`](./doctrine/tasks/best-responses.md) | Best Responses ranking doctrine |
| [`doctrine/copy/quality-messages.md`](./doctrine/copy/quality-messages.md) | Static respondent copy variants |
| [`backend-system-flow.md`](./backend-system-flow.md) | Broader AI/billing/cache flow |

Frontend repo: `Clearform_Version_2.0/` — builder card `ResponseQualityScoringCard.jsx`, evaluate hook `useResponseQualityEvaluation.js`, analytics `AnalyticsBestResponsesPanel.jsx`.

---

## What we were fixing

Founder and user testing on real forms (e.g. hackathon outreach) surfaced:

1. **Yellow/amber too generic** — “add more detail”, “add what's still missing”, random prefix words quoted instead of understanding the answer.
2. **False green** — missing multi-part question facets; “owner” leaking into respondent copy; hallucinated file paths in feedback.
3. **False red / missed red** — keyboard mash false positives (`src/main.py`, word “synthetic”); phrase stutter at end of long answers not caught; dismissive answers not red/amber enough.
4. **Inconsistent AI** — sometimes good answer-anchored copy, sometimes template fallback when LLM failed grounding.
5. **Best Responses broken** — profanity, dismissive, stale form-version answers ranked as “best” with high scores.
6. **Improve with AI** — stuck on “Improving…”, empty draft, JSON parse failures.
7. **Repeated suggestions** — same banner copy across keystrokes in one session.

**Important lesson (Jul 5):** Screenshots and WhatsApp messages are **reference for the class of bug**, not strings to hardcode. Prefer doctrine + prompt context + generic guards. **Do not** add `spec.md` or phrase lists for specific test answers.

---

## Pipeline architecture (unchanged core)

Live evaluate: `AiOrchestratorService.executeQuality()` → ordered stages:

```
cache → context → intent → violation → rules → llm → finalize
```

- **LLM path** (Pro / when enabled): model is primary for amber/green copy; code only guards extremes.
- **Rules/finalize fallback** (Free, LLM off, or LLM parse/grounding failure): `evaluateQualityRuleBased` + `finalizeStage`.
- **Session memory** (Redis): `QualitySessionMemoryService` — `shownMessages`, `shownSuggestions`, violation counts per screen.
- **Post-hooks on every non-cache stage:** `dedupeAgainstSession`, `finalizeQualityResult`, optional `applyAdequacyToResult` (in stage-specific paths).

Tier config: `src/ai/quality/quality-tier.config.ts` (`QUALITY_TIER_CONFIG`).

---

## Commits shipped (reference)

### Backend (`Clearform-backend-main`)

| SHA | Summary |
|-----|---------|
| `888620e` | Yellow quality refinement; strict best-responses filtering (plan baseline) |
| `ce74320` | File paths (`src/main.py`) not keyboard mash |
| `9925d8a` | “synthetic” not mash; dismissive → low_value amber |
| `c385b2d` | Answer-specific amber; anti-repeat messages; best-responses gate; `respondent-copy.util.ts` |
| `2636e1d` | Tail stutter → red; `ensureAnswerAnchoredAmber`; Improve-with-AI `jsonMode` |
| `1094ffd` | Context-first excerpts; double-wrap fix (reverted hardcoded hackathon patterns in next commit) |
| `e400ffc` | **Generic** `answer-context.util.ts`; removed `spec.md`; doctrine context-first section |
| `c88f7f0` | Chore: drop accidental local file from repo |

### Frontend (`Clearform_Version_2.0`)

| SHA | Summary |
|-----|---------|
| `3fd51cd` | Default owner prompt seed on toggle; Improve UX + timeout; Best Responses panel; `maxChars` in evaluate payload |

After deploy, tag Sentry/Linear: `clearform-api@<sha>` / `clearform-web@<sha>`.

---

## Backend modules (where to edit what)

| Area | Files |
|------|--------|
| **Pipeline stages** | `src/ai/quality/pipeline/*.stage.ts`, `ai-orchestrator.service.ts` |
| **Generic answer context** | `src/ai/quality/answer-context.util.ts` — excerpt, substance, question-part overlap |
| **Amber/green guards** | `src/ai/quality/near-complete.util.ts` — near-complete promotion, generic amber replacement |
| **Respondent copy hygiene** | `src/ai/quality/respondent-copy.util.ts` — no “owner”, no meta leaks, grounding check |
| **Signals** | `src/ai/quality/question-signals.util.ts` — stutter, concrete detail, re-exports from answer-context |
| **Semantic adequacy** | `src/ai/quality/semantic-adequacy.util.ts` — pre-LLM / post-LLM level guards |
| **Violations / rules** | `src/ai/ai-quality-rules.util.ts` — classify violations, mash, repetitive spam |
| **Finalize + eval prompt** | `src/ai/ai-quality.util.ts` — `buildEvalPromptFromContext`, `finalizeQualityResult` |
| **Anti-repeat** | `src/ai/quality/pipeline/anti-repeat.util.ts` — dedupe suggestions **and** messages; rotate using **answerText** |
| **Grounding validator** | `src/ai/grounding-validator.service.ts` — reject meta leaks, ungrounded quotes |
| **Improve with AI** | `src/ai/quality/improve-instructions.service.ts` |
| **Best Responses filter** | `src/analytics/best-responses-filter.util.ts`, `best-responses-ranker.service.ts` |
| **Owner default prompt** | `src/ai/quality/default-owner-quality-prompt.ts` |
| **Tests** | `quality-pipeline.golden.spec.ts`, `near-complete.util.spec.ts`, `answer-context.util.spec.ts`, `best-responses-filter.util.spec.ts` |

### Thin layers (what they do)

1. **`ensureAnswerAnchoredAmber`** — Only when message matches **generic template** (`isGenericAmberMessage`). Replaces with question-aware copy from `buildExcerptAnchoredSuggestion`. Does **not** force re-quote on every Pro amber. Substantive answers with no missing question part → leave for `applyAdequacyToResult` / near-complete promotion.

2. **`answer-context.util.ts`** — Generic only:
   - `extractAnswerExcerpt` — first substantive sentence/clause (skip filler words), not regex for “hackathon/food/management”.
   - `answerHasSubstance` — word count / multiple clauses.
   - `inferMissingQuestionAspect` — split question on `,` / `and`; keyword overlap with answer.

3. **`dedupeAgainstSession`** — Never pass prior **banner message** as fake answer to excerpt builder (caused `You mentioned "You said …"` bug).

4. **`hasPhraseStutter`** — Full text + tail window; alternating “word with word with word” patterns.

5. **Best Responses** — `filterResponsesForBestList` before LLM rank; heuristic score 0 for profanity/dismissive; snapshot-first answers; cache key **`analytics:best:v3:`** (bump version when filter logic changes).

---

## Frontend touchpoints

| File | Role |
|------|------|
| `src/features/forms/utils/defaultOwnerQualityPrompt.js` | Mirrors backend default owner prompt |
| `src/features/forms/components/ResponseQualityScoringCard.jsx` | Toggle seeds prompt; Improve with AI; 15s timeout; `showToast({ type, message })` |
| `src/features/forms/hooks/useResponseQualityEvaluation.js` | Sends `maxChars`, `answerCharCount` |
| `src/features/forms/components/BuilderContentCard.jsx` | Passes `maxChars` into quality hooks |
| `src/features/analytics/AnalyticsBestResponsesPanel.jsx` | Snapshot fetch; tier-aware copy |

---

## Product rules (agreed with founder)

| Signal | Meaning |
|--------|---------|
| **Green** | Substantively answers question (+ helper). May include **one** perfection tip if 2/3 facets present. |
| **Amber** | On topic but a **named** gap — must quote meaningful words from answer, not generic “add more”. |
| **Red** | Gibberish, profanity, hostility, stutter loops, or no topical signal. |

Other rules:

- No **“owner”** / **“form owner”** in respondent-facing copy.
- No **repeated** message/suggestion in same session — escalate to simpler angle.
- At **85%+ char limit**, do not push for more length.
- **Read before you ask** — if answer already has example/objection/like, do not ask for the same thing.
- Fixes must be **universal** (any form), not hardcoded to one outreach/hackathon form.

---

## What NOT to do next time

- Do **not** create `spec.md` or other docs from a user's **form answer text** (e.g. “my ai should read spec.md”) — that was test input, not a task.
- Do **not** add regex lists for specific founder examples (food, management, mentorship, file paths from one screenshot).
- Do **not** replace the pipeline with rule-only evaluation on Pro when LLM is available.
- Do **not** use `ensureAnswerAnchoredAmber` to rewrite **every** Pro amber — only **template** amber.
- Do **not** use anti-repeat `simplerMessageVariant` with the **previous message** as the answer source.

**Do** change behavior via:

1. `src/ai/doctrine/tasks/response-quality.md` (LLM instructions)
2. `buildEvalPromptFromContext` context blocks
3. Generic utilities in `answer-context.util.ts` / `near-complete.util.ts`
4. Golden fixtures in `quality-pipeline.golden.spec.ts`

---

## Verification checklist (manual)

1. Hard-refresh public form (new session) when testing quality banners.
2. **Multi-part experience question** — answer with experience + what they liked → expect **green** (or green-with-tip), not generic amber.
3. **Thin answer** — amber names **which part of the question** is missing.
4. **Stutter** — `working with working with working` at end of long text → **red**.
5. **Project fix** — answer about context/CORS without `backend/src/main.py` in text → feedback must not cite that path.
6. **Improve with AI** (builder, logged in) — empty or draft instructions → returns polished text within ~15s.
7. **Best Responses** — profanity/dismissive excluded; wait ~5 min or cache v3 after deploy.
8. Resolve related Sentry issues; close Linear with release tag.

### Run targeted tests

```bash
cd Clearform-backend-main
npm test -- --testPathPatterns="quality-pipeline.golden|near-complete|answer-context|anti-repeat|best-responses-filter|improve-instructions"
```

---

## Redis / cache keys (quality-related)

| Key | Notes |
|-----|--------|
| `ratelimit:response-quality:{formId}` | 60s public evaluate throttle |
| `analytics:best:v3:{formId}:...` | Best Responses list — **bump `v3` → `v4`** when filter/rank logic changes |
| Quality session memory | Per form+session; drives anti-repeat |

---

## Open watch items

- LLM still occasionally returns generic copy when grounding rejects all attempts → falls through to `finalizeStage` (rule-based). Mitigation: doctrine + `ensureAnswerAnchoredAmber` on templates only.
- Free tier / exhausted trial: rules-only path — less contextual than Pro LLM.
- Full test suite may have unrelated failures (e.g. `auth.controller.spec.ts`).

---

## Changelog entry (for future edits)

When you change quality behavior, append a row here:

| Date | SHA | Change |
|------|-----|--------|
| 2026-07-05 | `e400ffc` | Generic answer-context; removed hardcoded excerpt patterns and `spec.md` |
| 2026-07-05 | `2636e1d` | Tail stutter, Improve jsonMode, anchored amber guard |
| 2026-07-05 | `c385b2d` | Respondent copy hygiene, message anti-repeat, best-responses gate |
| 2026-06-xx | `888620e` | Yellow refinement plan baseline |
