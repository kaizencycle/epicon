# @epicon-guard/github-app

GitHub App integration for EPICON Guard.

## Shipped: webhook POST handler

A zero-dependency Node HTTP service that hosts the canonical GitHub App webhook
endpoint and verifies deliveries before acknowledging them:

```
POST /api/github/webhook   → verify X-Hub-Signature-256, return { "ok": true }
GET  /healthz              → 200 (platform health check)
```

Canonical URL: `https://epicon.mobius-substrate.com/api/github/webhook`

### Behavior

| Condition | Response |
|---|---|
| Valid signed event (`POST`) | `200 { "ok": true }` |
| Invalid / missing signature | `401 { "ok": false, "error": "invalid signature" }` |
| Non-`POST` method on the webhook path | `405` with `Allow: POST` |
| Unknown path | `404` |
| `GITHUB_WEBHOOK_SECRET` not configured | `500` (fail closed, logged) |

Events explicitly acknowledged and logged: `ping`, `installation`
(`created` / `deleted`), `installation_repositories` (`added` / `removed`),
and `pull_request`. Unknown events are still acknowledged with `200` (so GitHub
stops retrying) and logged as unhandled. Every request logs the event name,
delivery id (`X-GitHub-Delivery`), and installation id.

This handler is **transport only** — it verifies and logs. It performs no
database writes and does not change EPICON validator behavior.

### Run locally

```bash
GITHUB_WEBHOOK_SECRET=dev-secret PORT=3000 npm start --workspace @epicon-guard/github-app
# or from this directory:
GITHUB_WEBHOOK_SECRET=dev-secret PORT=3000 node src/server.mjs
```

Send a signed test delivery:

```bash
BODY='{"zen":"Keep it logically awesome.","hook_id":1}'
SIG="sha256=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "dev-secret" | awk '{print $2}')"
curl -sS -X POST http://localhost:3000/api/github/webhook \
  -H "content-type: application/json" \
  -H "x-github-event: ping" \
  -H "x-github-delivery: 00000000-0000-0000-0000-000000000000" \
  -H "x-hub-signature-256: $SIG" \
  --data "$BODY"
# → {"ok":true}
```

### Test

```bash
node test/webhook.test.mjs   # or: npm test --workspace @epicon-guard/github-app
```

### Deploy

A ready-to-use Render Blueprint is provided at the repo root (`render.yaml`).
The service binds `0.0.0.0:$PORT`, so it also runs unchanged on Fly, Railway,
or any container host. Set `GITHUB_WEBHOOK_SECRET` to the same secret configured
on the GitHub App, and point the App's webhook URL at
`https://<host>/api/github/webhook`.

## License

AGPL-3.0 - Part of Mobius Systems
