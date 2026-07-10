# epicon-api (Render)

**Service:** `epicon-api` on Render · **Public URL:** https://epicon-api.onrender.com  
**Source:** [kaizencycle/epicon](https://github.com/kaizencycle/epicon) · **Entry:** `packages/github-app/src/server.mjs`

## Role

`epicon-api` is the **EPICON Guard App webhook host (Phase 1)**. It receives signed
GitHub App webhook deliveries at `POST /api/github/webhook`. Phase 1 Probot I2
enforcement (C-368 PR5) converges on this service — do not create a separate
`epicon-guard-app` Render service.

## Endpoints

| Path | Method | Purpose |
|------|--------|---------|
| `/` | GET | JSON manifest (service, version, role, endpoint list) |
| `/health` | GET | Platform health — `200 {"ok":true,"service":"epicon-api","version":"…","ts":…}` |
| `/healthz` | GET | Legacy health alias (same payload as `/health`) |
| `/api/github/webhook` | POST | GitHub App webhook (requires `X-Hub-Signature-256`) |

## Deploy

Configured in [`render.yaml`](../../render.yaml) as `epicon-github-webhook` (service
name on Render dashboard may appear as `epicon-api`). Build from repo root (npm workspaces);
start `packages/github-app/src/server.mjs`:

```bash
npm install
node packages/github-app/src/server.mjs
```

**Required env:**

| Variable | Purpose |
|----------|---------|
| `GITHUB_WEBHOOK_SECRET` | Must match the GitHub App webhook secret |
| `APP_ID` | GitHub App ID — enables Probot I2 enforcement with `PRIVATE_KEY` |
| `PRIVATE_KEY` | GitHub App private key (PEM) |
| `WEBHOOK_PATH` | Default `/api/github/webhook` |

Without `APP_ID` + `PRIVATE_KEY`, the service runs **transport-only** (signature verify + log; no Check Runs).

**Health check:** `/health` (Render `healthCheckPath`). Response includes `enforcement_mode`: `probot-i2` or `transport-only`.

## Verification

From Mobius-Substrate after deploy:

```bash
./docs/epicon/cycles/C-368/c368-verify.sh pr4
```
