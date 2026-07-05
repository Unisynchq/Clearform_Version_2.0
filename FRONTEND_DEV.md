# Frontend-only local development

Use this workflow when you are **only working on the React UI** — no backend server, no Firebase keys required.

## Quick start

```bash
npm install
npm run dev
```

1. Copy `.env.example` to `.env.local` (or use the template below).
2. Ensure `VITE_USE_MOCK_API=true` and **do not** set `VITE_API_BASE_URL`.
3. Open the URL Vite prints (usually `http://localhost:5173`).
4. **Sign up** with any email + password (min 6 chars) on `/`.
5. Complete onboarding, then use the dashboard and form builder as normal.

All form data, workspaces, and responses persist in **localStorage** in your browser.

## What works offline

| Area | Local behavior |
|------|----------------|
| Auth | Email sign-up / sign-in (stored in `clearform_user_accounts`) |
| Forms & builder | localStorage + Redux |
| Publish / preview | Client-side snapshot |
| Analytics | Sample / cached data |
| Billing / integrations | UI only — no live payments or OAuth without backend |

Google and Microsoft buttons need Firebase keys in `.env.local`. For frontend work, use **email auth**.

## Blank screen fix

If you see a blank page, Firebase was initializing without API keys. Local mode now skips Firebase when `VITE_FIREBASE_API_KEY` is unset.

## Pushing changes (frontend only)

This repo **is** the frontend. When you push:

- **Do commit:** `src/`, `public/`, `index.html`, `vite.config.js`, `package.json`, `FRONTEND_DEV.md`, `progress.md`, tests under `e2e/`
- **Do not commit:** `.env.local` (secrets), `node_modules/`, `dist/`
- **Do not add** backend server code, NestJS routes, or database migrations here — backend lives in a separate repo/service.

Record what you changed in **`progress.md`** under a dated entry before pushing.

## Env template (`.env.local`)

```
VITE_USE_MOCK_API=true
```

Leave `VITE_API_BASE_URL` unset for offline mode.
