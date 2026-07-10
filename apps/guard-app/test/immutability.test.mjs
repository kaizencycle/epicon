import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { evaluateI2 } from '../src/immutability.js';

describe('evaluateI2', () => {
  const intentV1 = '```intent\nepicon_id: EPICON_C-368_CORE_foo_v1\nscope: core\n```';
  const intentMutated = '```intent\nepicon_id: EPICON_C-368_CORE_foo_v1\nscope: docs\n```';

  it('passes when no prior state', () => {
    assert.deepEqual(evaluateI2({ priorState: null, prBody: intentV1 }), { blocked: false });
  });

  it('blocks silent mutation', () => {
    const result = evaluateI2({
      priorState: { epicon_id: 'EPICON_C-368_CORE_foo_v1', justification_hash: 'abc' },
      prBody: intentMutated,
    });
    assert.equal(result.blocked, true);
    assert.match(result.message, /I2 VIOLATION/);
  });
});
