/**
 * EPICON Guard App — Probot entry (Phase 1).
 *
 * Mounts on epicon-api when APP_ID + PRIVATE_KEY are configured.
 * Falls back to transport-only mode when credentials are absent.
 */

import { fileURLToPath } from 'node:url';

import { Probot } from 'probot';

import { DEFAULT_POLICY, formatSummary, validatePullRequest } from '@epicon-guard/guard-core';

import { CHECK_NAME, evaluateI2, findPriorCheck, formatCheckState } from './immutability.js';

const REVALIDATE_CMD = /^\/epicon\s+revalidate\b/i;

async function listChangedFiles(octokit, owner, repo, pullNumber) {
  const files = [];
  let page = 1;
  while (page <= 10) {
    const { data } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 100,
      page,
    });
    files.push(...data.map((f) => f.filename));
    if (data.length < 100) break;
    page++;
  }
  return files;
}

async function runGate(context, { revalidate = false } = {}) {
  const { octokit, payload } = context;
  const pr = payload.pull_request;
  if (!pr) return;

  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const headSha = pr.head.sha;

  const priorState = await findPriorCheck(octokit, {
    owner,
    repo,
    headSha,
    pullNumber: pr.number,
  });
  const i2 = evaluateI2({ priorState, prBody: pr.body });

  if (i2.blocked) {
    await octokit.checks.create({
      owner,
      repo,
      name: CHECK_NAME,
      head_sha: headSha,
      status: 'completed',
      conclusion: 'failure',
      output: {
        title: 'I2 VIOLATION',
        summary: formatCheckState({
          epicon_id: priorState?.epicon_id,
          justification_hash: priorState?.justification_hash,
        }),
        text: i2.message,
      },
    });
    if (revalidate) {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: pr.number,
        body: `⛔ **EPICON Guard revalidate** — ${i2.message}`,
      });
    }
    return;
  }

  const changedFiles = await listChangedFiles(octokit, owner, repo, pr.number);
  const result = validatePullRequest({
    prBody: pr.body,
    changedFiles,
    policy: DEFAULT_POLICY,
  });

  const conclusion =
    result.status === 'PASS' || result.status === 'PASS_WITH_BACKFILL' ? 'success' : 'failure';

  const stateSummary = formatCheckState({
    epicon_id: result.epicon_id,
    justification_hash: result.justification_hash,
    supersedes: i2.supersedes,
  });

  await octokit.checks.create({
    owner,
    repo,
    name: CHECK_NAME,
    head_sha: headSha,
    status: 'completed',
    conclusion,
    output: {
      title: `EPICON Guard — ${result.status}`,
      summary: stateSummary,
      text: formatSummary(result),
    },
  });

  if (revalidate) {
    const icon = conclusion === 'success' ? '✅' : '⛔';
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: pr.number,
      body: `${icon} **EPICON Guard revalidate** — ${result.status} (tier ${result.prTier})`,
    });
  }
}

export function createGuardApp(options = {}) {
  const webhookPath =
    options.webhookPath ?? process.env.WEBHOOK_PATH ?? '/api/github/webhook';

  const probot = new Probot({
    appId: process.env.APP_ID,
    privateKey: process.env.PRIVATE_KEY,
    secret: process.env.GITHUB_WEBHOOK_SECRET,
    webhookPath,
  });

  probot.on(
    ['pull_request.opened', 'pull_request.edited', 'pull_request.synchronize'],
    async (context) => {
      await runGate(context);
    }
  );

  probot.on('issue_comment.created', async (context) => {
    const body = context.payload.comment?.body || '';
    if (!REVALIDATE_CMD.test(body)) return;
    if (!context.payload.issue?.pull_request) return;

    const { owner, repo } = context.repo();
    const issueNumber = context.payload.issue.number;
    const { data: pr } = await context.octokit.pulls.get({
      owner,
      repo,
      pull_number: issueNumber,
    });

    await runGate(
      {
        octokit: context.octokit,
        payload: { pull_request: pr, repository: context.payload.repository },
      },
      { revalidate: true }
    );
  });

  return probot;
}

// Standalone start for local / Render when running guard-app directly.
const entryPath = process.argv[1] ? fileURLToPath(import.meta.url) : '';
if (entryPath && process.argv[1] === entryPath) {
  const port = Number(process.env.PORT) || 3000;
  const probot = createGuardApp();
  probot.server
    .listen(port, '0.0.0.0', () => {
      console.log(`[epicon-guard-app] Probot listening on 0.0.0.0:${port}`);
    })
    .on('error', (err) => {
      console.error('[epicon-guard-app] failed to start:', err.message);
      process.exit(1);
    });
}
