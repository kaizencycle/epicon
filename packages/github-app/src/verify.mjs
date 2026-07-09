/**
 * GitHub webhook signature verification (EPICON Guard GitHub App).
 *
 * GitHub signs each webhook delivery with an HMAC-SHA256 over the exact raw
 * request body, keyed by the webhook secret, and sends it in the
 * `X-Hub-Signature-256: sha256=<hex>` header. We recompute the digest over the
 * raw bytes and compare in constant time.
 *
 * Zero runtime dependencies. Requires Node >= 18.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export const SIGNATURE_HEADER = 'x-hub-signature-256';

/**
 * Verify a GitHub webhook signature against the raw body.
 *
 * @param {Buffer|string} rawBody   Exact bytes of the request body.
 * @param {string|undefined} signature  Value of the X-Hub-Signature-256 header.
 * @param {string|undefined} secret     The configured webhook secret.
 * @returns {{ ok: boolean, reason: string }}
 */
export function verifySignature(rawBody, signature, secret) {
  if (!secret) return { ok: false, reason: 'secret-not-configured' };
  if (!signature) return { ok: false, reason: 'signature-missing' };

  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody ?? '', 'utf8');
  const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

  const received = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');

  // timingSafeEqual throws on length mismatch; a length difference is already a
  // definitive mismatch, so short-circuit without leaking timing information.
  if (received.length !== expectedBuf.length) {
    return { ok: false, reason: 'signature-mismatch' };
  }

  return {
    ok: timingSafeEqual(received, expectedBuf),
    reason: 'signature-mismatch',
  };
}
