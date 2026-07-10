/**
 * Shared EPICON Guard validation engine.
 * Used by the GitHub Action (src/validate.mjs) and Guard App (apps/guard-app).
 */

import { createHash } from 'node:crypto';

import {
  EPICON_ID_REGEX,
  MEC_CONSTITUTIONAL_REGEX,
  SCOPE_ENVELOPES,
  VALID_MODES,
  VALID_SCOPES,
  extractIntentBlocks,
  parseIntent,
} from './intent.mjs';

export {
  EPICON_ID_REGEX,
  MEC_CONSTITUTIONAL_REGEX,
  SCOPE_ENVELOPES,
  VALID_MODES,
  VALID_SCOPES,
  extractIntentBlocks,
  parseIntent,
} from './intent.mjs';

export {
  I2_VIOLATION_MESSAGE,
  compareIntentMutation,
  epiconVersion,
  formatCheckState,
  hashFromPrBody,
  justificationHash,
  parseCheckState,
} from './immutability.mjs';

export const DEFAULT_POLICY = {
  policy_id: 'epicon-guard-default-v0',
  'EP-1': [
    'docs/**',
    '*.md',
    '**/*.md',
    '.github/ISSUE_TEMPLATE/**',
    'LICENSE',
    '.gitignore',
  ],
  'EP-2': [
    'apps/**',
    'packages/**',
    'src/**',
    'lib/**',
    'labs/**',
    'experiments/**',
    'infra/**',
    'test/**',
    'tests/**',
    '**/*.test.*',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'render.yaml',
    'vercel.json',
  ],
  'EP-3': [
    'schemas/**',
    'docs/epicon/**',
    'docs/specs/**',
    '.github/workflows/**',
    'CODEOWNERS',
    '.github/CODEOWNERS',
    'SECURITY.md',
    'ledger/**',
    'canon/**',
    'journals/**',
    'sentinels/**',
  ],
};

const TIER_ORDER = { 'EP-1': 1, 'EP-2': 2, 'EP-3': 3 };

export function globMatch(pattern, path) {
  if (pattern.endsWith('/**')) return path.startsWith(pattern.slice(0, -2));
  const rx = new RegExp(
    '^' +
      pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '\u0001')
        .replace(/\*/g, '[^/]*')
        .replace(/\u0001/g, '.*') +
      '$'
  );
  return rx.test(path);
}

export function classifyFile(policy, path) {
  for (const tier of ['EP-3', 'EP-2', 'EP-1']) {
    for (const pattern of policy[tier] || []) {
      if (globMatch(pattern, path)) {
        return { tier, rule: `${policy.policy_id || 'default'}:${tier}:${pattern}` };
      }
    }
  }
  return { tier: 'EP-3', rule: `${policy.policy_id || 'default'}:5.2-deny-by-default` };
}

export function inEnvelope(scope, path) {
  const prefixes = SCOPE_ENVELOPES[scope] || [];
  return prefixes.some((p) => path.startsWith(p) || (p.includes('.') && path === p));
}

/**
 * Validate a pull request intent + changed files.
 * @param {object} opts
 * @param {string} opts.prBody
 * @param {string[]|null} opts.changedFiles - null = unclassifiable → EP-3
 * @param {object} [opts.policy]
 * @param {number} [opts.now] - epoch ms for expiry check
 */
export function validatePullRequest({
  prBody,
  changedFiles = null,
  policy = DEFAULT_POLICY,
  now = Date.now(),
}) {
  const errors = [];
  const warnings = [];
  const notices = [];

  const fail = (msg) => errors.push(msg);
  const warn = (msg) => warnings.push(msg);
  const note = (msg) => notices.push(msg);

  const blocks = extractIntentBlocks(prBody || '');
  if (blocks.length === 0) {
    fail(
      'I1 VIOLATION — No EPICON Intent Publication found. Intent must precede authority ' +
        '(EPICON-02 §2.1). Add a ```intent fenced block per .github/PULL_REQUEST_TEMPLATE.md §3.'
    );
  }
  if (blocks.length > 1) {
    warn(
      `Multiple intent blocks found (${blocks.length}); validating the first. ` +
        'Intent evolution requires re-publication with a version bump, not parallel intents (EPICON-02 §7).'
    );
  }

  const intentRaw = blocks[0] || '';
  const justificationHashValue = intentRaw
    ? createHash('sha256').update(intentRaw.trim()).digest('hex')
    : '';

  const { fields, justification, counterfactuals } = intentRaw
    ? parseIntent(intentRaw)
    : { fields: {}, justification: {}, counterfactuals: [] };

  if (intentRaw) {
    if (!fields.epicon_id) {
      fail('Missing epicon_id (EPICON-02 §4.1). Format: EPICON_C-XXX_SCOPE_slug_v1');
    } else if (!EPICON_ID_REGEX.test(fields.epicon_id)) {
      fail(`Malformed epicon_id "${fields.epicon_id}". Expected EPICON_C-<cycle>_<SCOPE>_<slug>_v<N>.`);
    }

    if (!fields.ledger_id) {
      if (fields.author) {
        warn('Intent uses legacy `author` field; migrate to `ledger_id` per PULL_REQUEST_TEMPLATE §3.');
      } else {
        fail('Missing ledger_id — intent must bind to an actor (EPICON-02 §4.1).');
      }
    }

    if (!fields.scope) {
      fail('I3 VIOLATION — Missing scope. Authority must be scoped (EPICON-02 §2.3).');
    } else if (!VALID_SCOPES.includes(fields.scope)) {
      fail(`Invalid scope "${fields.scope}". Allowed: ${VALID_SCOPES.join(' | ')}.`);
    }

    if (fields.mode && !VALID_MODES.includes(fields.mode)) {
      warn(`Unrecognized mode "${fields.mode}" (expected normal | emergency).`);
    }
    if (fields.mode === 'standard') warn('mode "standard" is legacy; use "normal".');
    if (fields.mode === 'emergency') {
      note('EMERGENCY MODE declared — divergence tolerance does not increase; visibility does (EPICON-02 §5.3).');
    }

    const issued = fields.issued_at ? Date.parse(fields.issued_at) : NaN;
    const expires = fields.expires_at ? Date.parse(fields.expires_at) : NaN;

    if (!fields.issued_at || Number.isNaN(issued)) {
      fail('I3 VIOLATION — Missing or unparseable issued_at (ISO 8601 required).');
    }
    if (!fields.expires_at || Number.isNaN(expires)) {
      fail('I5 VIOLATION — Missing or unparseable expires_at. Expiration is mandatory (EPICON-02 §2.5).');
    }
    if (!Number.isNaN(issued) && !Number.isNaN(expires)) {
      if (expires <= issued) {
        fail('I5 VIOLATION — expires_at must be after issued_at. Authority must be time-bounded.');
      }
      if (now > expires) {
        fail(
          'I5 VIOLATION — Intent has EXPIRED. Authority terminates at expires_at; ' +
            'no renewal without new Intent Publication (EPICON-02 §5.4). Re-publish with a version bump.'
        );
      }
      const days = (expires - issued) / 86400000;
      if (days > 120) {
        warn(
          `Authority window is ${Math.round(days)} days — long-lived intents weaken the Expiration Witness. Consider <= 90 days.`
        );
      }
    }

    const requiredJ = ['VALUES INVOKED', 'REASONING', 'ANCHORS', 'BOUNDARIES', 'COUNTERFACTUAL'];
    for (const key of requiredJ) {
      const present =
        key in justification ||
        (key === 'ANCHORS' && (justification.ANCHORS_LIST?.length || justification.ANCHORS));
      if (!present) {
        fail(
          `I6 — justification missing "${key}". Narrative claims may not substitute structured justification (EPICON-02 §2.6).`
        );
      }
    }
    const anchorCount = justification.ANCHORS_LIST?.length ?? (justification.ANCHORS ? 1 : 0);
    if (anchorCount < 2) {
      warn(`Only ${anchorCount} anchor(s) found — ej.schema.json requires >= 2 independent epistemic anchors.`);
    }

    if (counterfactuals.length === 0) {
      fail('Missing counterfactuals list — falsifiability conditions are required (EPICON-02 §4.1).');
    }

    if (fields.mec_citation) {
      if (MEC_CONSTITUTIONAL_REGEX.test(fields.mec_citation)) {
        note(`MEC citation valid: ${fields.mec_citation}`);
      } else {
        fail(
          `Malformed mec_citation "${fields.mec_citation}" — must match MEC_CONSTITUTIONAL_PATTERN (packages/mec-parser).`
        );
      }
    }

    const cyc = fields.epicon_id?.match(/^EPICON_C-(\d+)_/);
    if (cyc && Number(cyc[1]) === 0) warn('epicon_id cycle is C-0 — fill in the real cycle number.');
  }

  let prTier = changedFiles === null ? 'EP-3' : 'EP-1';
  let tierRule = changedFiles === null ? '5.2-deny-by-default:unclassifiable' : 'no-consequential-paths';
  const divergent = [];

  if (changedFiles && changedFiles.length > 0) {
    for (const f of changedFiles) {
      const { tier, rule } = classifyFile(policy, f);
      if (TIER_ORDER[tier] > TIER_ORDER[prTier]) {
        prTier = tier;
        tierRule = rule;
      }
      if (fields.scope && VALID_SCOPES.includes(fields.scope) && !inEnvelope(fields.scope, f)) {
        divergent.push(f);
      }
    }

    if (divergent.length > 0 && intentRaw) {
      warn(
        `I4 DIVERGENCE — ${divergent.length} changed file(s) outside the declared scope envelope ` +
          `"${fields.scope}": ${divergent.slice(0, 8).join(', ')}${divergent.length > 8 ? ', …' : ''}. ` +
          'Divergence is a state condition, not an accusation (EPICON-02 §3.3). ' +
          'Either widen the declared scope via intent re-publication, or split the PR.'
      );
    }
  } else if (changedFiles && changedFiles.length === 0) {
    note('No changed files reported for this PR.');
  }

  const hasErrors = errors.length > 0;
  let status;
  if (!hasErrors) {
    status = 'PASS';
  } else if (prTier === 'EP-1') {
    status = 'PASS_WITH_BACKFILL';
    note(
      'EP-1 fail-open: intent is missing/invalid but all changes classify EP-1. ' +
        'Backfill the intent block before merge — this pass is marked, not silent (spec §8).'
    );
  } else if (prTier === 'EP-2') {
    status = 'QUARANTINE';
  } else {
    status = 'FAIL_CLOSED';
  }

  return {
    status,
    prTier,
    tierRule,
    epicon_id: fields.epicon_id || '',
    ledger_id: fields.ledger_id || fields.author || '',
    scope: fields.scope || '',
    issued_at: fields.issued_at || '',
    expires_at: fields.expires_at || '',
    justification_hash: justificationHashValue,
    divergent,
    errors,
    warnings,
    notices,
    fields,
  };
}

export function formatSummary(result) {
  const icon = { PASS: '✅', PASS_WITH_BACKFILL: '🟡', QUARANTINE: '🟠', FAIL_CLOSED: '⛔' }[result.status];
  const hash = result.justification_hash;
  return [
    `## ${icon} EPICON Guard — ${result.status}`,
    '',
    '| Field | Value |',
    '|---|---|',
    `| **EPICON tier** | ${result.prTier} (policy-classified — Rule 5.1; rule: \`${result.tierRule}\`) |`,
    `| **Intent** | ${result.epicon_id ? `\`${result.epicon_id}\`` : '— none published —'} |`,
    `| **Actor** | ${result.ledger_id || '—'} |`,
    `| **Scope envelope** | ${result.scope || '—'} |`,
    `| **Authority window** | ${result.issued_at || '—'} → ${result.expires_at || '—'} |`,
    `| **justification_hash** | \`${hash ? hash.slice(0, 16) + '…' : '—'}\` |`,
    `| **Divergent paths (I4)** | ${result.divergent.length} |`,
    `| **Errors / warnings** | ${result.errors.length} / ${result.warnings.length} |`,
    '',
    result.errors.length ? '### Violations\n' + result.errors.map((e) => `- ⛔ ${e}`).join('\n') : '',
    result.warnings.length ? '### Flags (non-blocking)\n' + result.warnings.map((w) => `- ⚠️ ${w}`).join('\n') : '',
    '',
    '> *No consequential action without recorded intent. Mobius is the witness, not the actor.*',
  ]
    .filter(Boolean)
    .join('\n');
}

export function shouldFailCheck(result, mode = 'enforce') {
  return (result.status === 'QUARANTINE' || result.status === 'FAIL_CLOSED') && mode === 'enforce';
}
