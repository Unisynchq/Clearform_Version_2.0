# Task: Logic generation (B.7)

> Doctrine stack: `constitution.md` → `platform.md` → archetype → this file.  
> Context envelope: form title, purpose, all screens, field types, choice options.  
> Template: `src/ai/doctrine/templates/ai-service-template.md`

## Contract

Return JSON only:

```json
{
  "connections": [{"from":number,"to":number,"kind":"next"|"if"|"end"}],
  "ifRulesByEdge": {"<from>-<to>":{"rules":[...],"elseScreenId":number}},
  "showIfByScreenId": {}
}
```

## Rules

1. Read the form title, purpose, and every question label first. Decide branching from what is being asked, in the order it is asked — the graph must make sense to the form owner reading it back.
2. Include every content screen in the navigation graph.
3. Use `kind: "if"` with `ifRulesByEdge` ONLY on questions whose answers are enumerable: single/multiple choice, rating, yes/no, department. Write conditions against the exact option values listed for that screen.
4. Never attach if-rules to open text, long text, upload, media, contact, address, or date/time screens — those cannot branch meaningfully. Connect them with a plain `kind: "next"` to the following screen and leave them without rules.
5. Branch only where the question's meaning justifies it (e.g. a low rating routes to a follow-up, a department select routes to that department's questions). If a branch adds no value, prefer `next`. A mostly-linear graph is correct for a mostly-linear form.
6. Use `kind: "next"` for default sequential flow.
7. Last edge to end screen may use `kind: "end"`.
8. `ifRulesByEdge` conditions must reference `sourceScreenId` and `fieldId` that exist on that screen.
9. Department-aware forms: branch after department select when present.
10. Regenerate: treat previous graph in memory as negative example; produce improved branching.

## Multi-department scenario

When department select exists, create per-department paths or grouped branches before shared closing screens.
