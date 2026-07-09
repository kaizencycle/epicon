#!/usr/bin/env node
/**
 * EPICON Guard GitHub App — minimal webhook server.
 *
 * A zero-dependency Node HTTP server that hosts the canonical webhook endpoint:
 *
 *   POST /api/github/webhook   → verifies X-Hub-Signature-256, returns { ok: true }
 *   GET  /healthz              → 200 (platform health check)
 *
 * Binds 0.0.0.0:$PORT so it runs unchanged on Render / Fly / Railway / any
 * container host. Configure GITHUB_WEBHOOK_SECRET with the same secret set on
 * the GitHub App.
 *
 * Zero runtime dependencies. Requires Node >= 18.
 */

import { createServer as createHttpServer } from 'node:http';
import { handleWebhook, WEBHOOK_PATH } from './handler.mjs';

// GitHub caps webhook payloads at 25 MB and does not send larger deliveries, so
// the endpoint must accept the full documented size or valid deliveries (e.g. a
// large installation_repositories event) would be rejected before signature
// verification and GitHub would retry. 25 MiB (> 25 MB) is a safe default;
// override with MAX_WEBHOOK_BODY_BYTES if needed.
// Ref: https://docs.github.com/en/webhooks/webhook-events-and-payloads#payload-cap
export const DEFAULT_MAX_BODY_BYTES = 25 * 1024 * 1024;

function resolveMaxBodyBytes() {
  const fromEnv = Number(process.env.MAX_WEBHOOK_BODY_BYTES);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_MAX_BODY_BYTES;
}

class PayloadTooLargeError extends Error {}

function readRawBody(req, maxBodyBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    const done = (fn, arg) => {
      if (settled) return;
      settled = true;
      req.removeListener('data', onData);
      req.removeListener('end', onEnd);
      req.removeListener('error', onErr);
      fn(arg);
    };
    const onData = (chunk) => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        // Stop buffering and let the caller respond 413. We do not destroy the
        // socket here so a clean HTTP response can still be written.
        req.pause();
        done(reject, new PayloadTooLargeError('payload too large'));
        return;
      }
      chunks.push(chunk);
    };
    const onEnd = () => done(resolve, Buffer.concat(chunks));
    const onErr = (err) => done(reject, err);
    req.on('data', onData);
    req.on('end', onEnd);
    req.on('error', onErr);
  });
}

export function createServer({
  secret = process.env.GITHUB_WEBHOOK_SECRET,
  logger = console,
  maxBodyBytes = resolveMaxBodyBytes(),
} = {}) {
  return createHttpServer(async (req, res) => {
    const path = (req.url || '/').split('?')[0];

    // Lightweight health endpoint for hosting platforms (not the webhook route).
    if (req.method === 'GET' && (path === '/healthz' || path === '/')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, service: 'epicon-github-webhook' }));
      return;
    }

    let rawBody = Buffer.alloc(0);
    if (req.method === 'POST') {
      try {
        rawBody = await readRawBody(req, maxBodyBytes);
      } catch (err) {
        logger.warn(`[epicon-webhook] body read failed: ${err.message} → 413`);
        res.writeHead(413, { 'content-type': 'application/json', connection: 'close' });
        res.end(JSON.stringify({ ok: false, error: 'payload too large' }));
        return;
      }
    }

    const result = handleWebhook({
      method: req.method,
      path,
      headers: req.headers,
      rawBody,
      secret,
      logger,
    });

    res.writeHead(result.status, result.headers);
    res.end(result.body);
  });
}

// Start only when executed directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT) || 3000;
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    console.warn(
      '[epicon-webhook] WARNING: GITHUB_WEBHOOK_SECRET is not set. ' +
        'Signed deliveries will be rejected with 500 until it is configured.'
    );
  }

  const server = createServer({ secret });
  server.listen(port, '0.0.0.0', () => {
    console.log(`[epicon-webhook] listening on 0.0.0.0:${port}${WEBHOOK_PATH}`);
  });

  const shutdown = (signal) => {
    console.log(`[epicon-webhook] received ${signal}, shutting down.`);
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
