import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  compareIntentMutation,
  epiconVersion,
  hashFromPrBody,
  justificationHash,
} from '../src/immutability.mjs';

describe('immutability', () => {
  const intentV1 = 'epicon_id: EPICON_C-368_CORE_foo_v1\nledger_id: test\nscope: core';
  const intentV2 = 'epicon_id: EPICON_C-368_CORE_foo_v2\nledger_id: test\nscope: core';
  const intentMutated = 'epicon_id: EPICON_C-368_CORE_foo_v1\nledger_id: test\nscope: docs';

  it('extracts version from epicon_id', () => {
    assert.equal(epiconVersion('EPICON_C-368_CORE_foo_v2'), 2);
    assert.equal(epiconVersion('bad'), null);
  });

  it('detects unchanged hash', () => {
    const h = justificationHash(intentV1);
    assert.equal(
      compareIntentMutation({
        priorHash: h,
        priorEpiconId: 'EPICON_C-368_CORE_foo_v1',
        currentHash: h,
        currentEpiconId: 'EPICON_C-368_CORE_foo_v1',
      }),
      'unchanged'
    );
  });

  it('allows legal republication with version bump', () => {
    assert.equal(
      compareIntentMutation({
        priorHash: justificationHash(intentV1),
        priorEpiconId: 'EPICON_C-368_CORE_foo_v1',
        currentHash: justificationHash(intentV2),
        currentEpiconId: 'EPICON_C-368_CORE_foo_v2',
      }),
      'legal_republication'
    );
  });

  it('flags I2 violation on silent mutation', () => {
    assert.equal(
      compareIntentMutation({
        priorHash: justificationHash(intentV1),
        priorEpiconId: 'EPICON_C-368_CORE_foo_v1',
        currentHash: justificationHash(intentMutated),
        currentEpiconId: 'EPICON_C-368_CORE_foo_v1',
      }),
      'i2_violation'
    );
  });

  it('hashes from fenced PR body', () => {
    const body = '## Summary\n\n```intent\n' + intentV1 + '\n```';
    assert.equal(hashFromPrBody(body), justificationHash(intentV1));
  });
});
