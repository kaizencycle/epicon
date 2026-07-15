# EPICON Guard — Release Tag Policy

**Effective:** 2026-07-15 (C-373 PR-4)  
**Authority:** Custodian-approved; movements logged in this directory.

## Tags

| Tag | Semantics | Mutability |
| --- | --- | --- |
| `v1.0.0` | First public release matching truth-only README + guard-core validator | **Immutable** — never moved or deleted |
| `v1` | Floating convenience ref for Quick Start (`kaizencycle/epicon@v1`) | **Moves only** on post-merge `main` when a release PR explicitly retags it |
| `v1.1` | Feature release (base-SHA policy loading) | Immutable at its release SHA |

## Rules

1. **Immutable tags are append-only.** Once `vX.Y.Z` is pushed, it never moves.
2. **Floating `v1` moves only after merge to `main`.** Never retag from a PR branch; never retag without a logged entry in [`v1.md`](./v1.md).
3. **Retag requires witness.** Every `v1` movement records: date, target SHA, prior SHA, reason, and verifying test output.
4. **README `@v1` must resolve to code matching the README.** If `main` advances the Action, either retag `v1` in the same release PR or change docs — never both diverge.

## Verification commands (cycle-close canon)

```bash
git fetch origin main --tags
git rev-parse origin/main^{}          # main SHA
git rev-parse v1^{}                   # floating tag SHA — must match post-retag main
git rev-parse v1.0.0^{}               # immutable release SHA
node test/classify.test.mjs
node test/policy-ref.test.mjs
```

Check **refs, not renders.** GitHub's rendered repo page and CDN can lag; SHAs cannot.

## Movement log

All `v1` movements are appended to [`v1.md`](./v1.md#movement-log).
