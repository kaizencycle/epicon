/**
 * Intent block extraction and parsing (EPICON-02 §4.1).
 */

export const EPICON_ID_REGEX = /^EPICON_C-\d+_[A-Za-z0-9.]+_[a-z0-9][a-z0-9-]*_v\d+$/;
export const VALID_SCOPES = ['docs', 'ci', 'core', 'infra', 'sentinels', 'labs', 'specs'];
export const VALID_MODES = ['normal', 'emergency', 'standard'];

export const MEC_CONSTITUTIONAL_REGEX =
  /^E(\d+)\.RB(\d+)\.C(\d+)\.S(\d+):Q(\d+):((?:AT|ZE|EV|JA|AU|HE|EC|DA|UR|ZN)(?:\+(?:AT|ZE|EV|JA|AU|HE|EC|DA|UR|ZN))*):GI(\d{3})$/;

export const SCOPE_ENVELOPES = {
  docs: ['docs/', 'README', 'DOCS.md', 'CONTRIBUTING.md', 'LICENSE', 'FOR-'],
  ci: ['.github/'],
  core: ['app/', 'apps/', 'packages/', 'src/', 'lib/'],
  infra: ['infra/', 'render.yaml', 'vercel.json', 'Dockerfile', 'docker-compose', 'netlify.toml'],
  sentinels: ['sentinels/', 'agents/'],
  labs: ['labs/', 'experiments/'],
  specs: ['docs/specs/', 'schemas/', 'docs/epicon/'],
};

export function extractIntentBlocks(body) {
  const blocks = [];
  const re = /```intent\s*\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(body)) !== null) blocks.push(m[1]);
  return blocks;
}

export function parseIntent(raw) {
  const fields = {};
  const justification = {};
  const counterfactuals = [];
  let section = null;

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (/^justification\s*:/i.test(trimmed)) {
      section = 'justification';
      continue;
    }
    if (/^counterfactuals\s*:/i.test(trimmed)) {
      section = 'counterfactuals';
      continue;
    }

    if (section === 'counterfactuals') {
      if (trimmed.startsWith('-')) {
        counterfactuals.push(trimmed.replace(/^-+\s*/, ''));
        continue;
      }
      section = null;
    }

    if (section === 'justification' || section === 'anchors') {
      const jm = trimmed.match(/^([A-Z][A-Z ]+?)\s*:\s*(.*)$/);
      if (jm) {
        const key = jm[1].trim().toUpperCase();
        justification[key] = jm[2].trim();
        section = key === 'ANCHORS' ? 'anchors' : 'justification';
        continue;
      }
      if (section === 'anchors' && trimmed.startsWith('-')) {
        justification.ANCHORS_LIST = justification.ANCHORS_LIST || [];
        justification.ANCHORS_LIST.push(trimmed.replace(/^-+\s*/, ''));
        continue;
      }
      if (!/^[a-z_]+\s*:/.test(trimmed)) continue;
      section = null;
    }

    const km = trimmed.match(/^([a-z_]+)\s*:\s*(.*)$/);
    if (km) fields[km[1]] = km[2].trim();
  }

  return { fields, justification, counterfactuals };
}
