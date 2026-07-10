/**
 * Service manifest and health payloads for the epicon-api Render host.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { WEBHOOK_PATH } from './handler.mjs';

const PKG_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const { version: SERVICE_VERSION } = JSON.parse(
  readFileSync(join(PKG_DIR, 'package.json'), 'utf8'),
);

export const SERVICE_NAME = 'epicon-api';
export const SERVICE_ROLE = 'guard-app-host (phase 1)';
export const SOURCE_REPO = 'https://github.com/kaizencycle/epicon';
export const SOURCE_ROOT = 'packages/github-app';

export function healthPayload(ts = Math.floor(Date.now() / 1000)) {
  const enforcement =
    process.env.APP_ID?.trim() && process.env.PRIVATE_KEY?.trim() ? 'probot-i2' : 'transport-only';

  return {
    ok: true,
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    enforcement_mode: enforcement,
    ts,
  };
}

export function rootManifest(ts = Math.floor(Date.now() / 1000)) {
  return {
    ...healthPayload(ts),
    role: SERVICE_ROLE,
    purpose:
      'EPICON Guard GitHub App webhook host. Receives signed GitHub App deliveries; ' +
      'Phase 1 I2 enforcement (Probot) converges on this service.',
    repository: SOURCE_REPO,
    source_root: SOURCE_ROOT,
    render_service: 'epicon-api',
    endpoints: {
      health: { path: '/health', method: 'GET' },
      healthz: { path: '/healthz', method: 'GET', note: 'legacy alias' },
      webhook: { path: WEBHOOK_PATH, method: 'POST' },
    },
  };
}
