# epicon-api (Render)

**Service:** `epicon-api` on Render · **Public URL:** https://epicon-api.onrender.com  
**Source:** [kaizencycle/epicon](https://github.com/kaizencycle/epicon) · **Root:** `packages/github-app`

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
name on Render dashboard may appear as `epicon-api`). Build/start from
`packages/github-app`:

```bash
cd packages/github-app
npm install
node src/server.mjs
```

**Required env:** `GITHUB_WEBHOOK_SECRET` (must match the GitHub App webhook secret).

**Health check:** `/health` (Render `healthCheckPath`).

## Verification

From Mobius-Substrate after deploy:

```bash
./docs/epicon/cycles/C-368/c368-verify.sh pr4
```
