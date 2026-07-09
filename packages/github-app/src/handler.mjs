/**
 * EPICON Guard GitHub App — webhook event handler (transport layer).
 *
 * Pure request→response logic for the canonical endpoint:
 *
 *   POST https://epicon.mobius-substrate.com/api/github/webhook
 *
 * Responsibilities (this PR is transport repair only — no persistence, no
 * validator behavior changes):
 *   1. Accept POST only; every other method on the webhook path is 405.
 *   2. Verify X-Hub-Signature-256 against the raw body (401 on failure).
 *   3. Read the event type (X-GitHub-Event) and delivery id (X-GitHub-Delivery).
 *   4. Route the supported events and log event name, delivery id, and
 *      installation id.
 *   5. Return 200 { "ok": true } for valid signed events.
 *
 * Zero runtime dependencies. Requires Node >= 18.
 */

import { verifySignature, SIGNATURE_HEADER } from './verify.mjs';

export const WEBHOOK_PATH = '/api/github/webhook';
export const EVENT_HEADER = 'x-github-event';
export const DELIVERY_HEADER = 'x-github-delivery';

// Events this handler explicitly acknowledges. Unknown events are still
// accepted (200) so GitHub stops retrying, but logged as unhandled.
export const HANDLED_EVENTS = new Set([
  'ping',
  'installation',
  'installation_repositories',
  'pull_request',
]);

const json = (status, obj, extraHeaders = {}) => ({
  status,
  headers: { 'content-type': 'application/json', ...extraHeaders },
  body: JSON.stringify(obj),
});

function safeParse(rawBody) {
  try {
    const text = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody ?? '');
    return text ? JSON.parse(text) : {};
  } catch {
    return null;
  }
}

/**
 * Describe the effect of a supported event for logging. Returns a short,
 * human-readable action summary; never throws.
 */
function summarizeEvent(event, payload) {
  const action = payload?.action;
  switch (event) {
    case 'ping':
      return `ping (zen: ${payload?.zen ?? '—'})`;
    case 'installation':
      // installation.created | installation.deleted | suspend | unsuspend ...
      return `installation.${action ?? 'unknown'} on account ${payload?.installation?.account?.login ?? '—'}`;
    case 'installation_repositories': {
      // installation_repositories.added | .removed
      const added = payload?.repositories_added?.length ?? 0;
      const removed = payload?.repositories_removed?.length ?? 0;
      return `installation_repositories.${action ?? 'unknown'} (+${added}/-${removed})`;
    }
    case 'pull_request':
      return `pull_request.${action ?? 'unknown'} #${payload?.pull_request?.number ?? '—'} in ${payload?.repository?.full_name ?? '—'}`;
    default:
      return `${event}${action ? '.' + action : ''}`;
  }
}

/**
 * Handle a single webhook request.
 *
 * @param {object} req
 * @param {string} req.method
 * @param {string} req.path            Request path (query stripped).
 * @param {Record<string,string>} req.headers  Lower-cased header map.
 * @param {Buffer|string} req.rawBody  Exact request body bytes.
 * @param {string|undefined} req.secret  Webhook secret (GITHUB_WEBHOOK_SECRET).
 * @param {Console} [req.logger]
 * @returns {{ status: number, headers: Record<string,string>, body: string }}
 */
export function handleWebhook({ method, path, headers = {}, rawBody = '', secret, logger = console }) {
  if (path !== WEBHOOK_PATH) {
    return json(404, { ok: false, error: 'not found' });
  }

  // Requirement 9: 405 only for non-POST methods on the webhook route.
  if (method !== 'POST') {
    logger.warn(`[epicon-webhook] rejected ${method} ${path} → 405`);
    return json(405, { ok: false, error: 'method not allowed' }, { allow: 'POST' });
  }

  const event = headers[EVENT_HEADER];
  const delivery = headers[DELIVERY_HEADER];
  const signature = headers[SIGNATURE_HEADER];

  // Requirement 3 + 8: verify signature; invalid → 401.
  const verdict = verifySignature(rawBody, signature, secret);
  if (!verdict.ok) {
    if (verdict.reason === 'secret-not-configured') {
      logger.error(
        '[epicon-webhook] GITHUB_WEBHOOK_SECRET is not configured — cannot verify deliveries.'
      );
      return json(500, { ok: false, error: 'webhook secret not configured' });
    }
    logger.warn(
      `[epicon-webhook] signature rejected (${verdict.reason}) event=${event ?? '—'} delivery=${delivery ?? '—'} → 401`
    );
    return json(401, { ok: false, error: 'invalid signature' });
  }

  const payload = safeParse(rawBody);
  if (payload === null) {
    logger.warn(`[epicon-webhook] signed request with unparseable JSON body delivery=${delivery ?? '—'} → 400`);
    return json(400, { ok: false, error: 'invalid JSON body' });
  }

  const installationId = payload?.installation?.id ?? null;

  // Requirement 6: handle the listed events. Requirement: log event name,
  // delivery id, and installation id.
  const known = HANDLED_EVENTS.has(event);
  const line =
    `[epicon-webhook] event=${event ?? '—'} delivery=${delivery ?? '—'} ` +
    `installation=${installationId ?? '—'} → ${summarizeEvent(event, payload)}`;

  if (known) {
    logger.log(line);
  } else {
    logger.log(`${line} (unhandled event acknowledged)`);
  }

  // Requirement 7: 200 OK for valid signed events.
  return json(200, { ok: true });
}
