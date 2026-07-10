// Extracted policy-ref resolution logic test — mirrors validate.mjs (v1.1).
//
// v1.1 closes the self-classification bypass: on pull_request events the
// Guard now loads the trusted tier policy from the PR *base* SHA via the
// GitHub Contents API by default, instead of the workspace checkout the
// proposer's own diff could have edited.
function resolvePolicyRef(policyRefInput, pullRequest) {
  const ref = (policyRefInput || '').trim().toLowerCase();
  if (ref === 'workspace' || ref === 'head') return 'workspace';
  if (ref === 'base') return pullRequest?.base?.sha ? `git:${pullRequest.base.sha}` : 'workspace';
  if (!ref) return pullRequest?.base?.sha ? `git:${pullRequest.base.sha}` : 'workspace';
  return `git:${policyRefInput.trim()}`;
}

function parsePolicyJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const withBase = { base: { sha: 'abc123def' } };
const withoutBase = {};

const cases = [
  ['explicit "base", pr.base.sha present', 'base', withBase, 'git:abc123def'],
  ['explicit "base", pr.base.sha missing', 'base', withoutBase, 'workspace'],
  ['explicit "workspace"', 'workspace', withBase, 'workspace'],
  ['explicit "head" (alias for workspace)', 'head', withBase, 'workspace'],
  ['omitted input defaults to base, sha present', '', withBase, 'git:abc123def'],
  ['omitted input, no pr.base.sha', '', withoutBase, 'workspace'],
  ['explicit ref/SHA passthrough', 'refs/heads/main', withBase, 'git:refs/heads/main'],
];

let pass = 0;
for (const [label, input, pullRequest, expect] of cases) {
  const got = resolvePolicyRef(input, pullRequest);
  const ok = got === expect;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(42)} -> ${got}${ok ? '' : ` EXPECTED ${expect}`}`);
}

// parsePolicyJson: valid vs malformed registry JSON.
const jsonCases = [
  ['valid JSON object', '{"policy_id":"x","EP-1":["docs/**"]}', true],
  ['malformed JSON', '{not valid json', false],
];
for (const [label, raw, expectTruthy] of jsonCases) {
  const got = parsePolicyJson(raw);
  const ok = expectTruthy ? got !== null : got === null;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(42)} -> ${JSON.stringify(got)}`);
}

const total = cases.length + jsonCases.length;
console.log(`\n${pass}/${total} policy-ref resolution cases pass`);
process.exit(pass === total ? 0 : 1);
