/**
 * I2 immutability helpers — compare intent hashes across PR edits.
 * EPICON-02 §7: legal re-publication requires epicon_id version bump.
 */

import { createHash } from 'node:crypto';

import { extractIntentBlocks } from './intent.mjs';

export const I2_VIOLATION_MESSAGE =
  'I2 VIOLATION — intent mutated after publication. Re-publish with a version bump; the prior intent remains on record.';

export function justificationHash(intentRaw) {
  if (!intentRaw) return '';
  return createHash('sha256').update(intentRaw.trim()).digest('hex');
}

export function hashFromPrBody(body) {
  const blocks = extractIntentBlocks(body || '');
  return justificationHash(blocks[0] || '');
}

/** Parse trailing _vN from epicon_id (e.g. EPICON_C-368_CORE_foo_v2 → 2). */
export function epiconVersion(epiconId) {
  const m = String(epiconId || '').match(/_v(\d+)$/);
  return m ? Number(m[1]) : null;
}

/**
 * Compare prior vs current intent publication state.
 * @returns {'unchanged' | 'legal_republication' | 'i2_violation'}
 */
export function compareIntentMutation({ priorHash, priorEpiconId, currentHash, currentEpiconId }) {
  if (!priorHash || priorHash === currentHash) return 'unchanged';

  const priorV = epiconVersion(priorEpiconId);
  const currentV = epiconVersion(currentEpiconId);

  if (
    priorEpiconId &&
    currentEpiconId &&
    priorV !== null &&
    currentV !== null &&
    currentV === priorV + 1 &&
    priorEpiconId.replace(/_v\d+$/, '') === currentEpiconId.replace(/_v\d+$/, '')
  ) {
    return 'legal_republication';
  }

  return 'i2_violation';
}

/** Parse { epicon_id, justification_hash } from a prior check run output summary. */
export function parseCheckState(summary) {
  if (!summary) return null;
  const epiconMatch = summary.match(/epicon_id:\s*(\S+)/i);
  const hashMatch = summary.match(/justification_hash:\s*([a-f0-9]{64})/i);
  if (!hashMatch) return null;
  return {
    epicon_id: epiconMatch?.[1] || '',
    justification_hash: hashMatch[1],
  };
}

/** Serialize state for check-run output.summary (Phase 1 state store). */
export function formatCheckState({ epicon_id, justification_hash, supersedes }) {
  const lines = [
    'EPICON Guard — Intent Publication Gate',
    `epicon_id: ${epicon_id || '—'}`,
    `justification_hash: ${justification_hash || '—'}`,
  ];
  if (supersedes) lines.push(`supersedes: ${supersedes}`);
  return lines.join('\n');
}
