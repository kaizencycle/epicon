#!/usr/bin/env node
/**
 * EPICON Guard — GitHub Action entrypoint (thin wrapper over @epicon-guard/guard-core).
 */

import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  DEFAULT_POLICY,
  formatSummary,
  shouldFailCheck,
  validatePullRequest,
} from '../packages/guard-core/src/index.mjs';

const annotate = (level, msg) => console.log(`::${level}::${msg}`);

function setOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
}

function writeSummary(md) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
  } else {
    console.log('\n' + md);
  }
}

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath || !existsSync(eventPath)) {
  console.error('No GITHUB_EVENT_PATH — EPICON Guard must run on pull_request events.');
  process.exit(1);
}
const event = JSON.parse(readFileSync(eventPath, 'utf8'));
const pr = event.pull_request;
if (!pr) {
  console.error('Event payload has no pull_request — check workflow trigger.');
  process.exit(1);
}

const prBody = pr.body || '';
const repoFull = process.env.GITHUB_REPOSITORY || '';
const mode = (process.env.INPUT_MODE || 'enforce').toLowerCase();

const DEFAULT_POLICY_PATH = '.github/epicon-policy.json';

function parsePolicyJson(raw, source) {
  try {
    return JSON.parse(raw);
  } catch {
    annotate('warning', `Unparseable policy JSON (${source}) — falling back to default registry.`);
    return null;
  }
}

function resolvePolicyRef(policyRefInput, pullRequest) {
  const ref = (policyRefInput || '').trim().toLowerCase();
  if (ref === 'workspace' || ref === 'head') return 'workspace';
  if (ref === 'base') return pullRequest?.base?.sha ? `git:${pullRequest.base.sha}` : 'workspace';
  if (!ref) return pullRequest?.base?.sha ? `git:${pullRequest.base.sha}` : 'workspace';
  return `git:${policyRefInput.trim()}`;
}

function loadPolicyFromWorkspace(policyPath) {
  const override = join(process.env.GITHUB_WORKSPACE || '.', policyPath);
  if (!existsSync(override)) return DEFAULT_POLICY;
  const parsed = parsePolicyJson(readFileSync(override, 'utf8'), override);
  if (!parsed) return DEFAULT_POLICY;
  annotate('notice', `Tier policy loaded from workspace ${policyPath} (${parsed.policy_id || 'unnamed'}).`);
  return parsed;
}

async function fetchPolicyFromGitHub(ref, policyPath) {
  const token = process.env.INPUT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token || !repoFull) {
    annotate('warning', 'No token available — cannot load policy from Git ref.');
    return null;
  }
  const encodedPath = policyPath.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(
    `https://api.github.com/repos/${repoFull}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`,
    { headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' } }
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    annotate('warning', `GitHub API ${res.status} while loading policy at ref ${ref} — skipping remote policy.`);
    return null;
  }
  const data = await res.json();
  if (!data.content) return null;
  const raw = Buffer.from(data.content, 'base64').toString('utf8');
  return parsePolicyJson(raw, `${ref}:${policyPath}`);
}

async function loadPolicy() {
  const policyPath = process.env.INPUT_POLICY_PATH || DEFAULT_POLICY_PATH;
  const resolved = resolvePolicyRef(process.env.INPUT_POLICY_REF, pr);

  if (resolved === 'workspace') {
    return loadPolicyFromWorkspace(policyPath);
  }

  const gitRef = resolved.startsWith('git:') ? resolved.slice(4) : resolved;
  const fromApi = await fetchPolicyFromGitHub(gitRef, policyPath);
  if (fromApi) {
    annotate('notice', `Tier policy loaded from ref ${gitRef} at ${policyPath} (${fromApi.policy_id || 'unnamed'}).`);
    return fromApi;
  }
  annotate('notice', `No policy at ${policyPath} on ref ${gitRef}; using built-in deny-by-default registry.`);
  return DEFAULT_POLICY;
}

async function fetchChangedFiles() {
  const token = process.env.INPUT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    annotate('warning', 'No token available — skipping changed-file analysis (tier + divergence).');
    return null;
  }
  const files = [];
  let page = 1;
  while (page <= 10) {
    const res = await fetch(
      `https://api.github.com/repos/${repoFull}/pulls/${pr.number}/files?per_page=100&page=${page}`,
      { headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' } }
    );
    if (!res.ok) {
      annotate('warning', `GitHub API ${res.status} while listing PR files — skipping tier/divergence analysis.`);
      return null;
    }
    const batch = await res.json();
    files.push(...batch.map((f) => f.filename));
    if (batch.length < 100) break;
    page++;
  }
  return files;
}

const policy = await loadPolicy();
const changed = await fetchChangedFiles();
const result = validatePullRequest({ prBody, changedFiles: changed, policy });

for (const e of result.errors) annotate('error', e);
for (const w of result.warnings) annotate('warning', w);
for (const n of result.notices) annotate('notice', n);

setOutput('tier', result.prTier);
setOutput('status', result.status);
setOutput('epicon_id', result.epicon_id);
setOutput('justification_hash', result.justification_hash);
setOutput('divergence_count', String(result.divergent.length));

writeSummary(
  formatSummary(result) +
    `\n> Spec: \`docs/specs/EPICON_TIERING_SPEC_v0.1.md\` · \`docs/epicon/EPICON-02.md\` · mode: \`${mode}\``
);

console.log(
  `\nEPICON Guard verdict: ${result.status} (tier ${result.prTier}, ${result.errors.length} error(s), ${result.warnings.length} warning(s))`
);

if (shouldFailCheck(result, mode)) {
  process.exit(1);
}
process.exit(0);
