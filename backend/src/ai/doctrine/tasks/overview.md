# Task: Form overlay overview (B.13)

## Contract

Return JSON only:

```json
{
  "message": "One actionable sentence with real metrics and screen label.",
  "actionableStep": {
    "action": "improve_screen" | "open_logic" | "view_analytics",
    "screenId": 12,
    "screenLabel": "Your name",
    "dropPercent": 34,
    "estimatedGain": 4,
    "builderTab": "content" | "logic" | "design"
  }
}
```

## Rules

1. `message` cites real completion rate and worst drop-off screen (e.g. "Q3 (Your name) loses 34%").
2. Use screen labels from snapshot — never generic "Step 3".
3. `actionableStep.action`:
   - `improve_screen` — high drop-off on a content screen
   - `open_logic` — branching or routing issue suspected
   - `view_analytics` — insufficient drop-off signal; review analytics tab
4. `estimatedGain`: projected completion recovery from drop count and total responses.
5. Return `null` when &lt; 3 responses or no meaningful drop-off (all screens healthy).
6. `builderTab` defaults to `content` for `improve_screen`, `logic` for `open_logic`.

## Improve with AI mapping

Frontend reads `actionableStep` to navigate builder: focus `screenId`, select `builderTab`.
