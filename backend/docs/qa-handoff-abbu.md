# QA checklist (Abbu / founder)

Run on **production** after deploy (`app.clearform.in`, `api.clearform.in`).

## Auth and builder

- [ ] Sign in (Chrome) — lands on dashboard, not stuck on sign-in
- [ ] Form builder **Back** — returns to dashboard (not sign-in)
- [ ] Publish form — success toast / live status

## Public form (preview = published)

- [ ] Open `/f/:formId` incognito — theme and layout match builder preview
- [ ] Branching logic — same path as preview for a test answer
- [ ] Animations — screen transitions feel smooth (not static jumps)

## Analytics

- [ ] **Responses** — submit on public form → row appears for that `formId`
- [ ] **Compare** — tab loads metrics or clear empty/error (not infinite skeleton)
- [ ] **AI Insights** — loads cards, “need 10 responses”, or error + Retry (not infinite spinner)
- [ ] **Delete form** — Settings → delete succeeds (no 500 in console)

## Integrations (when CLE-19 done)

- [ ] Connect Google Sheets / webhook test from profile or form settings

## API health

```bash
curl -sS https://api.clearform.in/api/v1/health
```

Expect `"status":"ok"` and redis/database up.
