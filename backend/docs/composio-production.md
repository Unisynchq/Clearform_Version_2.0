# Composio production setup (CLE-19)

## Dashboard

1. Composio project → **Auth configs**: enable **googlesheets**, **slack**, **googledrive** (Composio-managed OAuth).
2. Callback URL: `https://api.clearform.in/api/v1/integrations/callback`
3. Copy **API key** → VPS `.env` as `COMPOSIO_API_KEY`.

## VPS `.env`

```bash
INTEGRATION_PROVIDER=composio
COMPOSIO_API_KEY=<from dashboard>
# Optional if auto-resolve fails:
# COMPOSIO_AUTH_CONFIG_GOOGLE_SHEETS=ac_...
# COMPOSIO_AUTH_CONFIG_SLACK=ac_...
```

Deploy:

```bash
cd /var/www/clearform-backend
git pull && bun run build
npx prisma migrate deploy
pm2 restart clearform-backend --update-env
```

## App flow

1. User connects from **Share modal** or **Profile → Integrations** (`POST /workspaces/:id/integrations/:provider/connect`).
2. User saves **spreadsheet ID** / **Slack channel** via `PATCH /workspaces/:id/integrations/:connectionId`.
3. On each new response, backend `dispatchForResponse` appends a structured Sheets row (headers from published snapshot).
4. **Sync existing**: `POST /workspaces/:id/integrations/:connectionId/sync-historical` with `{ "formId": "..." }`.

## Sheets format

- Header row once: `responseId`, `submittedAt`, then question labels from published snapshot.
- Data rows: one column per question from `answersByScreenId` (not a single JSON blob).

## Troubleshooting

| Issue | Check |
|-------|--------|
| 502 on connect | `composio.service.ts` uses v3 `connectedAccounts.link`; API key valid |
| No sheet row | `spreadsheetId` in metadata; connection `active`; Composio account linked |
| Wrong columns | Republish form so snapshot matches live questions |

See also `memory.md` and `production-smoke-checklist.md`.
