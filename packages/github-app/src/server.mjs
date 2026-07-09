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

const MAX_BODY_BYTES = 5 * 1024 * 1024; // GitHub caps webhook payloads at ~25MB; 5MB is safely generous here.

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function createServer({ secret = process.env.GITHUB_WEBHOOK_SECRET, logger = console } = {}) {
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
        rawBody = await readRawBody(req);
      } catch (err) {
        logger.warn(`[epicon-webhook] body read failed: ${err.message} → 413`);
        res.writeHead(413, { 'content-type': 'application/json' });
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
