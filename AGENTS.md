# AGENTS.md

## Cursor Cloud specific instructions

EPICON Guard is a **zero-dependency GitHub Action** (a composite action defined in
`action.yml`). The shipped product is the validator `src/validate.mjs` (plain ESM,
Node ≥ 20, no runtime deps). Everything else is context around it:

- `packages/*` are **README-only stubs** ("Coming Soon") — they have no `package.json`
  and no code. Turborepo therefore finds **0 packages**, so `npm test`, `npm run lint`,
  `npm run type-check`, and `npm run build` all succeed trivially with "0 packages"
  (they are effectively no-ops today). Do not expect them to run real work.
- `website/` is a static GitHub Pages landing page (plain HTML/CSS, no build step).

### Real commands (what actually verifies the product)

- Install dev tooling: `npm install` (root only; `turbo`, `prettier`, `typescript`).
  Note: there is no committed lockfile checked in historically, so `npm ci` may fail —
  prefer `npm install`.
- Run the real test suite: `node test/classify.test.mjs` (tier classifier cases; exits
  non-zero on failure). This is the test the README points to, not `npm test`.
- Run the Action/validator locally by simulating a `pull_request` event: set
  `GITHUB_EVENT_PATH` to one of `test/fixtures/event-*.json` and run
  `node src/validate.mjs`. Useful env vars: `GITHUB_REPOSITORY`, `INPUT_MODE`
  (`enforce`|`warn`), `GITHUB_OUTPUT`/`GITHUB_STEP_SUMMARY` (file paths to capture
  Action outputs/summary). Example:
  `GITHUB_EVENT_PATH=test/fixtures/event-valid.json GITHUB_REPOSITORY=kaizencycle/epicon node src/validate.mjs`
- Tier classification + I4 divergence require a token: without `GITHUB_TOKEN`/
  `INPUT_GITHUB_TOKEN` the validator **skips changed-file analysis and defaults the PR
  tier to EP-3 (Rule 5.2 deny-by-default)** — this is intended, not a bug. To exercise
  that path locally, pass a token (e.g. `GITHUB_TOKEN=$(gh auth token)`) and point the
  event's `pull_request.number` at a real PR in `GITHUB_REPOSITORY`.
- Formatting: `npx prettier --check "**/*.{ts,tsx,md,json}"` currently reports warnings
  on several pre-existing docs/JSON files. `npm run format` (prettier `--write`) would
  rewrite them — don't run it unless formatting is the task.

### Serving the website in dev

Static, no build: `cd website && python3 -m http.server 8080` (or any static server),
then open `http://localhost:8080/`.

### Verdict semantics (so you can read validator output)

Exit code is `1` only when `status` is `QUARANTINE` or `FAIL_CLOSED` **and** mode is
`enforce`. `PASS` and `PASS_WITH_BACKFILL` (EP-1 fail-open) exit `0`. Statuses map to
the EPICON tiering failure matrix: EP-1 → fail-open, EP-2 → quarantine, EP-3 → fail-closed.
