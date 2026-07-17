import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { inEnvelope } from '../src/index.mjs';

describe('scope envelopes', () => {
  it('covers Next.js App Router paths under core', () => {
    assert.equal(inEnvelope('core', 'app/api/vault/status/route.ts'), true);
    assert.equal(inEnvelope('core', 'lib/vault-v2/store.ts'), true);
  });

  it('still covers legacy apps/ monorepo layout under core', () => {
    assert.equal(inEnvelope('core', 'apps/terminal/api/route.ts'), true);
  });

  it('rejects paths outside the declared scope', () => {
    assert.equal(inEnvelope('infra', 'app/api/vault/status/route.ts'), false);
    assert.equal(inEnvelope('docs', 'lib/vault-v2/store.ts'), false);
  });
});
