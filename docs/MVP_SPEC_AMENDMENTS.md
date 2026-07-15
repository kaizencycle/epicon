# MVP_SPEC Amendments (C-373)

Recorded deviations from `MVP_SPEC.md` (authoritative handoff companion).
The spec serves the build; amendments keep the trail coherent.

## D1 — Validator location

| Handoff | Shipped |
| --- | --- |
| `packages/validator/` | `packages/guard-core/` (`@epicon-guard/guard-core`) |

**Rationale:** Validator extraction landed in `guard-core` during C-368 as shared
engine for Action + App. Functionally identical scope: six invariants, deny-by-default,
base-SHA policy pinning, zero runtime dependencies. Directory rename deferred as
compliance theater.

**Entrypoint:** `src/validate.mjs` imports from `../packages/guard-core/src/index.mjs`.
