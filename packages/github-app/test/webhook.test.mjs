/**
 * End-to-end tests for the EPICON Guard GitHub webhook endpoint.
 *
 * Boots the real Node HTTP server on an ephemeral port and exercises it over
 * the wire (signed/unsigned POSTs, non-POST methods, unknown paths), plus unit
 * coverage of the signature verifier. Zero test-framework dependencies.
 */

import { createHmac } from 'node:crypto';
import { verifySignature } from '../src/verify.mjs';
import { createServer } from '../src/server.mjs';

const SECRET = 'epicon-test-secret';

function sign(body, secret = SECRET) {
  return 'sha256=' + createHmac('sha256', secret).update(Buffer.from(body, 'utf8')).digest('hex');
}

// Silence handler logging during tests but keep it inspectable.
const logs = [];
const logger = {
  log: (m) => logs.push(m),
  warn: (m) => logs.push(m),
  error: (m) => logs.push(m),
};

let pass = 0;
let fail = 0;
function check(name, cond, detail = '') {
  if (cond) {
    pass++;
    console.log(`PASS  ${name}`);
  } else {
    fail++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function main() {
  // ---- Unit: signature verification ---------------------------------------
  const body = JSON.stringify({ zen: 'Keep it logically awesome.' });
  check('verify: valid signature ok', verifySignature(body, sign(body), SECRET).ok === true);
  check('verify: wrong secret rejected', verifySignature(body, sign(body, 'nope'), SECRET).ok === false);
  check('verify: tampered body rejected', verifySignature(body + ' ', sign(body), SECRET).ok === false);
  check('verify: missing signature rejected', verifySignature(body, undefined, SECRET).ok === false);
  const noSecret = verifySignature(body, sign(body), undefined);
  check('verify: no secret configured', noSecret.ok === false && noSecret.reason === 'secret-not-configured');

  // ---- End-to-end over HTTP ------------------------------------------------
  const server = createServer({ secret: SECRET, logger });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  const url = `${base}/api/github/webhook`;

  const post = (payload, { event = 'ping', delivery = 'test-delivery-1', signature } = {}) =>
    fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-github-event': event,
        'x-github-delivery': delivery,
        'x-hub-signature-256': signature ?? sign(payload),
      },
      body: payload,
    });

  // 1. Valid signed ping → 200 { ok: true }
  {
    const p = JSON.stringify({ zen: 'Design for failure.', hook_id: 1 });
    const res = await post(p, { event: 'ping' });
    const jsonBody = await res.json();
    check('POST ping (valid sig) → 200', res.status === 200, `got ${res.status}`);
    check('POST ping body is { ok: true }', jsonBody.ok === true);
  }

  // 2. installation.created → 200, logs installation id
  {
    const p = JSON.stringify({ action: 'created', installation: { id: 424242, account: { login: 'kaizencycle' } } });
    const res = await post(p, { event: 'installation', delivery: 'inst-created-1' });
    check('POST installation.created → 200', res.status === 200, `got ${res.status}`);
    check('installation.created logged with installation id', logs.some((l) => l.includes('installation=424242') && l.includes('installation.created')));
  }

  // 3. installation.deleted → 200
  {
    const p = JSON.stringify({ action: 'deleted', installation: { id: 424242, account: { login: 'kaizencycle' } } });
    const res = await post(p, { event: 'installation', delivery: 'inst-deleted-1' });
    check('POST installation.deleted → 200', res.status === 200, `got ${res.status}`);
  }

  // 4. installation_repositories.added / removed → 200
  {
    const added = JSON.stringify({ action: 'added', installation: { id: 7 }, repositories_added: [{ full_name: 'a/b' }] });
    const removed = JSON.stringify({ action: 'removed', installation: { id: 7 }, repositories_removed: [{ full_name: 'a/b' }] });
    const r1 = await post(added, { event: 'installation_repositories', delivery: 'ir-add-1' });
    const r2 = await post(removed, { event: 'installation_repositories', delivery: 'ir-rm-1' });
    check('POST installation_repositories.added → 200', r1.status === 200, `got ${r1.status}`);
    check('POST installation_repositories.removed → 200', r2.status === 200, `got ${r2.status}`);
  }

  // 5. pull_request → 200
  {
    const p = JSON.stringify({ action: 'opened', pull_request: { number: 42 }, repository: { full_name: 'kaizencycle/epicon' }, installation: { id: 9 } });
    const res = await post(p, { event: 'pull_request', delivery: 'pr-opened-1' });
    check('POST pull_request.opened → 200', res.status === 200, `got ${res.status}`);
  }

  // 6. Unknown event still acknowledged → 200 (GitHub stops retrying)
  {
    const p = JSON.stringify({ action: 'labeled' });
    const res = await post(p, { event: 'issues', delivery: 'issues-1' });
    check('POST unknown event → 200 (acknowledged)', res.status === 200, `got ${res.status}`);
    check('unknown event logged as unhandled', logs.some((l) => l.includes('unhandled event acknowledged')));
  }

  // 7. Invalid signature → 401
  {
    const p = JSON.stringify({ zen: 'x' });
    const res = await post(p, { event: 'ping', signature: 'sha256=deadbeef' });
    const jsonBody = await res.json();
    check('POST invalid signature → 401', res.status === 401, `got ${res.status}`);
    check('401 body reports invalid signature', jsonBody.ok === false && jsonBody.error === 'invalid signature');
  }

  // 8. Tampered body (valid-looking sig for different body) → 401
  {
    const original = JSON.stringify({ zen: 'trust' });
    const tampered = JSON.stringify({ zen: 'trust', evil: true });
    const res = await post(tampered, { event: 'ping', signature: sign(original) });
    check('POST tampered body → 401', res.status === 401, `got ${res.status}`);
  }

  // 9. Non-POST methods → 405 with Allow: POST
  {
    const res = await fetch(url, { method: 'GET' });
    check('GET webhook path → 405', res.status === 405, `got ${res.status}`);
    check('405 sets Allow: POST', (res.headers.get('allow') || '').toUpperCase().includes('POST'));
    const put = await fetch(url, { method: 'PUT' });
    check('PUT webhook path → 405', put.status === 405, `got ${put.status}`);
  }

  // 10. Unknown path → 404 (not 405)
  {
    const res = await fetch(`${base}/api/github/other`, { method: 'POST', body: '{}' });
    check('POST unknown path → 404', res.status === 404, `got ${res.status}`);
  }

  // 11. Health endpoint → 200
  {
    const res = await fetch(`${base}/healthz`);
    check('GET /healthz → 200', res.status === 200, `got ${res.status}`);
  }

  // 12. Missing secret configuration → 500 (fail closed)
  {
    const insecure = createServer({ secret: undefined, logger });
    await new Promise((r) => insecure.listen(0, '127.0.0.1', r));
    const p = JSON.stringify({ zen: 'x' });
    const res = await fetch(`http://127.0.0.1:${insecure.address().port}/api/github/webhook`, {
      method: 'POST',
      headers: { 'x-github-event': 'ping', 'x-hub-signature-256': sign(p) },
      body: p,
    });
    check('POST with unconfigured secret → 500', res.status === 500, `got ${res.status}`);
    await new Promise((r) => insecure.close(r));
  }

  await new Promise((r) => server.close(r));

  console.log(`\n${pass}/${pass + fail} webhook checks pass`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
