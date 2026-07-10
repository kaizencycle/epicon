# EPICON Guard App (Phase 1)

Probot GitHub App that enforces **I2 (intent immutable once published)** via the Checks API.

## Deploy

Phase 1 converges on the existing **epicon-api** Render service (`packages/github-app` host).
Do **not** create a separate `epicon-guard-app` service.

### Environment

| Variable | Purpose |
|---|---|
| `APP_ID` | GitHub App ID |
| `PRIVATE_KEY` | PEM private key (multiline) |
| `GITHUB_WEBHOOK_SECRET` | Webhook secret (shared with github-app transport) |
| `PORT` | HTTP port (Render sets automatically) |

### Register

1. Create app at GitHub → Settings → Developer settings → GitHub Apps
2. Webhook URL: `https://epicon-api.onrender.com/api/github/webhook`
3. Permissions: `checks: write`, `pull_requests: read`, `contents: read`
4. Events: `pull_request`, `issue_comment`
5. Install on federation repos

## I2 behavior

| Event | Action |
|---|---|
| `pull_request.opened` | Validate via `@epicon-guard/guard-core`; create Check Run **Intent Publication Gate**; store `{epicon_id, justification_hash}` in check output |
| `pull_request.edited` / `synchronize` | Recompute hash; compare to prior check run |
| Hash unchanged | Revalidate normally |
| Hash changed + `_v(N)` → `_v(N+1)` | Legal re-publication; note `supersedes: <old hash>` |
| Hash changed without version bump | **Fail:** I2 VIOLATION |
| `/epicon revalidate` comment | Re-run validation; post comment + check |

## Local dev

```bash
cd apps/guard-app
npm install
APP_ID=... PRIVATE_KEY="..." GITHUB_WEBHOOK_SECRET=... npm start
```

## Shared validator

Validation logic lives in `packages/guard-core` — shared with the GitHub Action (`src/validate.mjs`) to prevent drift.
