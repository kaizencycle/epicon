# 🛡️ EPICON Guard

**Git commits tell you WHAT changed. EPICON tells you WHY.**

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)
[![Status: Pre-Launch](https://img.shields.io/badge/Status-Pre--Launch-orange)](#roadmap)

---

## What is EPICON Guard?

EPICON Guard is an **Intent Publication Gate** for GitHub: a CI action that fails closed unless a pull request declares *why* it exists before it can merge.

Traditional version control records what changed, when, and by whom — but never why, never for how long the decision should hold, and never what would make you revert it. As AI agents open more of your PRs, that gap becomes dangerous. EPICON Guard closes it.

**Intent must precede authority.** No declared intent, no merge.

---

## What works today

One thing. It works, and you can verify it:

| Component | Status |
| --- | --- |
| **EPICON Guard GitHub Action** | ✅ Working — this repo |

Everything else lives in the [Roadmap](#roadmap) until it ships. We hold this README to the same standard the Guard holds your PRs: no claim without evidence.

---

## Quick Start

**1. Add the workflow** to `.github/workflows/epicon-guard.yml`:

```yaml
name: EPICON Guard
on:
  pull_request:
    types: [opened, edited, synchronize, reopened]
permissions:
  contents: read
  pull-requests: read
jobs:
  epicon:
    name: Intent Publication Gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: kaizencycle/epicon@v1
        with:
          mode: enforce
```

**2. Open a PR with an intent block** in the description:

````markdown
```intent
epicon_id: EPICON_C-367_CORE_stripe-integration_v1
ledger_id: acme:payments:stripe-integration
scope: core
mode: normal
issued_at: 2026-07-15T16:00:00Z
expires_at: 2026-08-15T16:00:00Z
justification:
  VALUES INVOKED: integrity, transparency, cost-efficiency
  REASONING: Adding Stripe payment integration for credit card processing.
    Current provider (Braintree) has 2.9% fees; Stripe offers 2.4% plus
    better fraud detection. Projected savings of $50k/year.
  ANCHORS:
    - Braintree and Stripe public fee schedules
    - Internal fraud-rate benchmarks, Q2 report
  BOUNDARIES: Credit card processing only; does not cover invoicing or payouts
  COUNTERFACTUAL: If fraud rate exceeds 0.5%, this justification fails
counterfactuals:
  - If fraud rate increases >0.5%, revert
  - If A/B test shows worse conversion, stay with Braintree
  - If users report payment issues, disable
```
````

**3. The Guard validates.** A PR without a valid intent block fails closed:

```
Error: I1 VIOLATION — No EPICON Intent Publication found.
Intent must precede authority (EPICON-02 §2.1).
EPICON Guard verdict: FAIL_CLOSED (tier EP-3, 1 error(s), 0 warning(s))
```

Add the block, and it passes. That's the whole cost of compliance: one fenced block per PR.

▶ **Live demo** — public fail → fix → pass repository is on the [roadmap](#roadmap) (not yet published).

---

## Why counterfactuals?

The intent block's most important field is the one no other tool has: **counterfactuals** — the conditions under which this change should be reverted, written down *before* it merges.

Most engineering decisions don't fail loudly; they quietly outlive the assumptions that justified them. A counterfactual is a tripwire for that: "if fraud exceeds 0.5%, revert" turns a vague someday-judgment-call into a checkable condition. Six months later, nobody has to reconstruct what the author was worried about — it's in the record.

## How the gate stays honest

Two design properties matter more than any feature:

- **Proposer independence.** The Guard classifies a PR using the tier policy from the *base* branch, not the PR's own edits. A change can't weaken the policy and downgrade its own risk tier in the same breath.
- **Deny by default.** A PR that can't be classified is treated as highest-risk (EP-3), not lowest. Absence of policy is not permission.

The validator is zero-dependency Node — small enough to read in one sitting. Don't trust the gate; audit it. The source is in [`packages/`](packages/).

---

## Configuration

Tier policy lives in `.github/epicon-policy.json` in your repo. It maps paths and change types to enforcement tiers (EP-1 advisory → EP-3 fail-closed). If no policy file exists, the Guard uses its built-in deny-by-default registry.

Full schema and examples: [docs/](docs/)

---

## Roadmap

Everything below is planned, not shipped. It moves up to [What works today](#what-works-today) when — and only when — it's real and verifiable.

**Next**
- Versioned releases and a stability guarantee for the `v1` tag
- Intent block linting (quality feedback, not just presence)
- Public demo repository with the canonical fail → fix → pass sequence

**Planned**
- GitHub App (installation-based, no workflow file needed)
- Intent AI: draft the intent block from the diff — "Copilot for intent"
- Scope enforcement: changes limited to declared scope
- Expiry tracking: surface intents that outlived their `expires_at`

**Exploring**
- Organization dashboard and integrity scoring
- GitLab / Jira / Slack integrations
- Self-hosted deployment
- Paid tiers for private repos and teams

Want something prioritized? [Open an issue](../../issues).

---

## Contributing

EPICON Guard is open source under AGPL-3.0.

```bash
git clone https://github.com/kaizencycle/epicon.git
cd epicon
npm install
npm test
```

Pull requests to this repo require an intent block. Naturally.

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## About

EPICON Guard implements the EPICON-02 protocol ("no consequential action without recorded intent") developed inside [Mobius Substrate](https://mobius-substrate.com), an open civic AI governance project. The Guard has been the merge gate for the Mobius federation since mid-2026 — every invariant here was adopted because something broke without it.

---

## License

[AGPL-3.0](LICENSE)

---

**🛡️ Git commits tell you WHAT changed. EPICON tells you WHY.**
