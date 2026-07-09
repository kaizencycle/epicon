// Extracted classifier logic test — mirrors validate.mjs
const DEFAULT_POLICY = JSON.parse(`{
  "policy_id": "epicon-guard-default-v0",
  "EP-1": ["docs/**", "*.md", "**/*.md", ".github/ISSUE_TEMPLATE/**", "LICENSE", ".gitignore"],
  "EP-2": ["apps/**", "packages/**", "src/**", "lib/**", "labs/**", "experiments/**", "infra/**", "test/**", "tests/**", "**/*.test.*", "package.json", "package-lock.json", "tsconfig.json", "render.yaml", "vercel.json"],
  "EP-3": ["schemas/**", "docs/epicon/**", "docs/specs/**", ".github/workflows/**", "CODEOWNERS", ".github/CODEOWNERS", "SECURITY.md", "ledger/**", "canon/**", "journals/**", "sentinels/**"]
}`);
function globMatch(pattern, path) {
  if (pattern.endsWith('/**')) return path.startsWith(pattern.slice(0, -2));
  const rx = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0001').replace(/\*/g, '[^/]*').replace(/\u0001/g, '.*') + '$');
  return rx.test(path);
}
function classifyFile(policy, path) {
  for (const tier of ['EP-3', 'EP-2', 'EP-1']) {
    for (const pattern of policy[tier] || []) {
      if (globMatch(pattern, path)) return { tier, pattern };
    }
  }
  return { tier: 'EP-3', pattern: '5.2-deny-by-default' };
}
const cases = [
  ['docs/handbook/intro.md', 'EP-1'],
  ['README.md', 'EP-1'],
  ['packages/mec-parser/src/index.ts', 'EP-2'],
  ['apps/terminal/api/attest.ts', 'EP-2'],
  ['docs/epicon/EPICON-02.md', 'EP-3'],          // canon beats docs/** (EP-3 checked first)
  ['schemas/epicon_constitutional_v1.schema.json', 'EP-3'],
  ['.github/workflows/deploy.yml', 'EP-3'],
  ['CODEOWNERS', 'EP-3'],
  ['journals/cycles/C-367.json', 'EP-3'],
  ['random/mystery/thing.bin', 'EP-3'],          // Rule 5.2 deny-by-default
  ['docs/specs/MEC_SPEC_v0.1.md', 'EP-3'],       // spec canon beats **/*.md
];
let pass = 0;
for (const [path, expect] of cases) {
  const { tier, pattern } = classifyFile(DEFAULT_POLICY, path);
  const ok = tier === expect;
  if (ok) pass++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${path.padEnd(48)} -> ${tier} (${pattern})${ok ? '' : ` EXPECTED ${expect}`}`);
}
console.log(`\n${pass}/${cases.length} classification cases pass`);
process.exit(pass === cases.length ? 0 : 1);
