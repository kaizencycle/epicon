/**
 * I2 enforcement — check-run state store and mutation detection.
 */

import {
  I2_VIOLATION_MESSAGE,
  compareIntentMutation,
  formatCheckState,
  hashFromPrBody,
  parseCheckState,
} from '@epicon-guard/guard-core';

export const CHECK_NAME = 'Intent Publication Gate';

/** Find the most recent completed check run for this gate. */
export async function findPriorCheck(octokit, { owner, repo, headSha }) {
  const { data } = await octokit.checks.listForRef({
    owner,
    repo,
    ref: headSha,
    check_name: CHECK_NAME,
    per_page: 5,
  });
  const prior = data.check_runs?.find((r) => r.output?.summary);
  return prior ? parseCheckState(prior.output.summary) : null;
}

/**
 * Evaluate I2 mutation before running full validation.
 * @returns {{ blocked: boolean, message?: string, supersedes?: string }}
 */
export function evaluateI2({ priorState, prBody }) {
  if (!priorState?.justification_hash) return { blocked: false };

  const currentHash = hashFromPrBody(prBody);
  const blocks = prBody?.match(/```intent\s*\n([\s\S]*?)```/);
  let currentEpiconId = '';
  if (blocks) {
    const idMatch = blocks[1].match(/^epicon_id:\s*(\S+)/m);
    currentEpiconId = idMatch?.[1] || '';
  }

  const mutation = compareIntentMutation({
    priorHash: priorState.justification_hash,
    priorEpiconId: priorState.epicon_id,
    currentHash,
    currentEpiconId,
  });

  if (mutation === 'i2_violation') {
    return { blocked: true, message: I2_VIOLATION_MESSAGE };
  }
  if (mutation === 'legal_republication') {
    return { blocked: false, supersedes: priorState.justification_hash };
  }
  return { blocked: false };
}

export { formatCheckState, hashFromPrBody, parseCheckState };
