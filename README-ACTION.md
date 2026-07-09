# EPICON Guard — GitHub Action (v0)

> **No consequential action without recorded intent.**
> Mobius is the constitutional witness, not the actor.

EPICON Guard validates the **Intent Publication block** in every pull request
body and classifies the PR into a consequence tier (**EP-1 / EP-2 / EP-3**)
using a declarative policy registry. If a consequential PR carries no valid
intent, the check fails closed.

Source of truth: [`Mobius-Substrate/docs/epicon`](https://github.com/kaizencycle/Mobius-Substrate/tree/main/docs/epicon)
— specifically EPICON-02 (IPDP), `EPICON_TIERING_SPEC_v0.1`, and
`epicon_constitutional_v1.schema.json`.

## Install (any repo, five lines)

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

Then add an ` ```intent ` block to your PR body (the
[Mobius PR template](https://github.com/kaizencycle/Mobius-Substrate/blob/main/.github/PULL_REQUEST_TEMPLATE.md)
includes it in section 3). To make the gate binding, mark **Intent Publication
Gate** as a required status check in branch protection.

## What it enforces

| # | EPICON-02 invariant | Enforcement |
|---|---|---|
| I1 | Intent must precede authority | Intent block required; missing intent fails EP-2/EP-3 PRs |
| I2 | Intent immutable once published | `justification_hash` (SHA-256) emitted as output and in the run summary |
| I3 | Authority scoped and time-bounded | `scope` enum + `issued_at`/`expires_at` validated |
| I4 | Divergence observable, not blocked | Changed files outside the scope envelope are flagged, never blocked |
| I5 | Expiration is mandatory | Missing or past `expires_at` fails; no renewal without re-publication |
| I6 | No narrative substitutes verification | Structured justification (VALUES / REASONING / ANCHORS / BOUNDARIES / COUNTERFACTUAL) required |

## Tiering (EPICON_TIERING_SPEC_v0.1)

- **Rule 5.1** — the PR's self-declared Risk Tier checkboxes are advisory only;
  the Guard computes tier from the policy registry, independent of the proposer.
- **Rule 5.2** — paths matching no registry pattern classify **EP-3**
  (deny-by-default; unknown ≠ harmless).
- **Rule 5.3** — PR tier = the maximum tier across all changed files.
- **§8 failure matrix** — EP-1 fails **open** (pass, with honest backfill
  marking); EP-2 **quarantines** (check fails, remediable); EP-3 fails
  **closed**.

Override the default registry by committing `.github/epicon-policy.json`
(see [`policy/epicon-policy.example.json`](./policy/epicon-policy.example.json)).

## Outputs

`tier`, `status` (`PASS | PASS_WITH_BACKFILL | QUARANTINE | FAIL_CLOSED`),
`epicon_id`, `justification_hash`, `divergence_count` — consumable by
downstream steps (e.g. future CPC ledger attestation).

## Roadmap

- **v0 (this)** — GitHub Action: PR-boundary validation, tier classification, divergence flagging
- **v1** — GitHub App (Probot): Checks API, intent-immutability enforcement across `edited` events, `/epicon revalidate` commands, org-wide installation tokens (retiring PATs)
- **v2** — CPC ledger attestation: valid intents immortalized via `/ledger/attest`, constitutional EPICON commitments for EP-3 merges

## License

CC0 1.0 Universal (Public Domain). *"We heal as we walk."*
