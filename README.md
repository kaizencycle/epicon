# 🛡️ EPICON Guard

**Git commits tell you WHAT changed. EPICON tells you WHY.**

[![License: CC0-1.0](https://img.shields.io/badge/license-CC0--1.0-lightgrey)](./LICENSE)
[![Part of: Mobius Substrate](https://img.shields.io/badge/Mobius-Substrate-6E00FF)](https://mobius-substrate.com)
[![GitHub Action: v1](https://img.shields.io/badge/GitHub%20Action-v1-2ea44f)](https://github.com/kaizencycle/epicon)

> **No consequential action without recorded intent.**
> Mobius is the constitutional witness, not the actor.

---

## What is EPICON?

EPICON is the Mobius Substrate constitutional principle that no consequential
action may occur without recorded intent. **EPICON Guard** is its first
enforcement surface: a GitHub Action that validates a structured **Intent
Publication** in every pull request and classifies the PR into a consequence
tier before merge.

Traditional Git tracks **what** changed, **when**, and **who**. It does not
track **why** it changed, **when the authority to change it expires**, or
**what would make you revert**. EPICON Guard adds that layer.

The protocol does not prevent actions. It makes divergence legible,
attributable, and time-bound.

---

## What ships today: the GitHub Action

Add five lines to any repo:

```yaml
# .github/workflows/epicon-guard.yml
name: EPICON Guard
on:
  pull_request:
    types: [opened, edited, synchronize, reopened]
permissions:
  contents: read
  pull-requests: read
jobs:
  epicon:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: kaizencycle/epicon@v1
```

Then include an intent block in your PR body:

````markdown
```intent
epicon_id: EPICON_C-367_CORE_stripe-integration_v1
ledger_id: your-github-username
scope: core
mode: normal
issued_at: 2026-07-09T00:00:00Z
expires_at: 2026-08-09T00:00:00Z
justification:
  VALUES INVOKED: integrity, transparency, cost-efficiency
  REASONING: Current provider fees are 2.9%; Stripe offers 2.4% plus
    stronger fraud detection. Projected savings $50k/year.
  ANCHORS:
    - Provider fee schedules (public pricing pages)
    - Internal fraud-rate benchmarks, Q2 report
  BOUNDARIES: Does not apply to invoicing or payout flows
  COUNTERFACTUAL: If fraud rate rises above 0.5%, this justification fails
counterfactuals:
  - If fraud rate increases >0.5%, revert
  - If A/B test shows worse conversion, stay with current provider
```
````

To make the gate binding, mark **Intent Publication Gate** as a required
status check in branch protection. That is the moment EPICON becomes a
precondition gate rather than an audit log.

---

## What it enforces

Every check maps to a named invariant from
[EPICON-02 (Intent Publication & Divergence Protocol)](https://github.com/kaizencycle/Mobius-Substrate/blob/main/docs/epicon/EPICON-02.md):

| # | Invariant | Enforcement |
|---|---|---|
| I1 | Intent must precede authority | Intent block required; missing intent fails consequential PRs |
| I2 | Intent immutable once published | `justification_hash` (SHA-256) emitted as a witness |
| I3 | Authority scoped and time-bounded | `scope` enum + `issued_at` / `expires_at` validated |
| I4 | Divergence observable, not blocked | Files outside the scope envelope are flagged, never blocked |
| I5 | Expiration is mandatory | Missing or past `expires_at` fails; re-publication required |
| I6 | No narrative substitutes verification | Structured justification required — prose never passes the gate |

### Consequence tiers

PRs are classified **EP-1 / EP-2 / EP-3** per the
[EPICON Tiering Specification](https://github.com/kaizencycle/Mobius-Substrate/blob/main/docs/specs/EPICON_TIERING_SPEC_v0.1.md):

- **Rule 5.1** — tier is computed from a declarative path registry, never from
  the proposer's self-assessment. The PR's own Risk Tier checkboxes are advisory.
- **Rule 5.2** — paths matching no registry pattern classify EP-3.
  Deny-by-default: unknown ≠ harmless.
- **Rule 5.3** — PR tier = the maximum tier across all changed files.
- **Failure matrix (§8)** — EP-1 fails open with honest backfill marking;
  EP-2 quarantines; EP-3 fails closed.

Override the default registry by committing `.github/epicon-policy.json` —
see [`policy/epicon-policy.example.json`](./policy/epicon-policy.example.json).

### Outputs

`tier` · `status` (`PASS | PASS_WITH_BACKFILL | QUARANTINE | FAIL_CLOSED`) ·
`epicon_id` · `justification_hash` · `divergence_count` — consumable by
downstream workflow steps.

---

## Source of truth

The Action implements — it does not define. Canon lives in the Mobius
Substrate monorepo:

- [`docs/epicon/`](https://github.com/kaizencycle/Mobius-Substrate/tree/main/docs/epicon) — EPICON-01/02/03 specifications, EJ schema, templates
- [`docs/specs/EPICON_TIERING_SPEC_v0.1.md`](https://github.com/kaizencycle/Mobius-Substrate/blob/main/docs/specs/EPICON_TIERING_SPEC_v0.1.md) — EP-1/2/3 grammar
- [`schemas/epicon_constitutional_v1.schema.json`](https://github.com/kaizencycle/Mobius-Substrate/blob/main/schemas/epicon_constitutional_v1.schema.json) — ledger commitment schema

---

## Status

| Component | Status |
|-----------|--------|
| GitHub Action (Intent Publication Gate) | ✅ Live — `kaizencycle/epicon@v1` |
| Landing site (GitHub Pages) | ✅ Live |
| GitHub App (Checks API, intent immutability, `/epicon revalidate`) | 🔄 Roadmap — v1 |
| CPC ledger attestation (EP-3 constitutional commitments) | 🔄 Roadmap — v2 |
| Dashboard / Corporate Integrity Index (CII) | 💡 Concept |
| GitLab / Jira / Slack integrations | 💡 Concept |

If it isn't marked ✅, it doesn't exist yet. This README does not sell futures.

---

## Repository layout

```
action.yml          # Composite action — the consumable entrypoint
src/validate.mjs    # Zero-dependency validator (Node ≥ 20)
policy/             # Example tier policy registry
examples/           # Consumer workflow for adopting repos
test/               # Fixtures + classifier tests
docs/               # Product spec and intent records
website/            # Landing page (GitHub Pages)
```

---

## Contributing

```bash
git clone https://github.com/kaizencycle/epicon.git
cd epicon
node test/classify.test.mjs
```

Every PR to this repo is validated by the Guard it ships. See
[CONTRIBUTING.md](./CONTRIBUTING.md).

---

## About Mobius Substrate

EPICON Guard is part of [Mobius Substrate](https://mobius-substrate.com),
civic AI governance infrastructure. Mobius is not a data warehouse and not a
decision-maker — it is a constitutional witness. Decision-making remains with
humans and authorized systems; EPICON records, gates, and attests.

Related components: the Mobius ledger (integrity-backed audit chain), MIC
(integrity-gated credit), and the sentinel council (ATLAS, ZEUS, EVE, JADE,
AUREA and roster).

---

## License

CC0 1.0 Universal (public domain). Spec and implementation. Do anything;
attribution appreciated, never required.

The hosted attestation layer (Guard App, dashboard) is not covered by this
repository license — only the grammar and validator source here.

---

**🛡️ Git commits tell you WHAT changed. EPICON tells you WHY.**

*Built by [kaizencycle](https://github.com/kaizencycle) · [Mobius Substrate](https://mobius-substrate.com) · "We heal as we walk."*
