# PR Intent — EPICON Guard v0 (Phase 0 Action)

Paste the block below into the PR body (section 3 of the PR template).

```intent
epicon_id: EPICON_C-367_CI_epicon-guard-action_v1
ledger_id: kaizencycle
scope: ci
mode: normal
issued_at: 2026-07-09T00:00:00Z
expires_at: 2026-10-07T00:00:00Z
justification:
  VALUES INVOKED: integrity, transparency, accountability, safety
  REASONING: EPICON is canon (EP tiering, PR #357) but unenforced at the PR
    boundary; the README promises a Guard that does not exist. This Action
    closes the gap between constitutional claim and runtime behavior by
    validating Intent Publications (EPICON-02) and policy-classifying PR
    consequence tiers (EP-1/EP-2/EP-3) before merge.
  ANCHORS:
    - docs/epicon/EPICON-02.md (IPDP v1.0.0, invariants I1-I6)
    - docs/specs/EPICON_TIERING_SPEC_v0.1.md (Rules 5.1-5.3, failure matrix section 8)
    - schemas/epicon_constitutional_v1.schema.json (MEC citation pattern)
  BOUNDARIES: PR-boundary enforcement only; does not gate runtime actions,
    does not write to the CPC ledger, does not enforce intent immutability
    across edits (Phase 1 App responsibility).
  COUNTERFACTUAL: If the tiering spec fails seal quorum or the intent block
    grammar changes in the PR template, this Action's validators must be
    revised before further rollout.
counterfactuals:
  - If the Guard produces false FAIL_CLOSED verdicts on canon PRs, switch mode to warn and patch
  - If policy classification can be gamed by path renaming, escalate matched patterns to EP-3
  - If seal quorum rejects EPICON_TIERING_SPEC_v0.1, freeze rollout at Mobius-Substrate only
```

**Witnesses:** ATLAS (drafting) — quorum not required (EP-2 surface, single-attestor per spec §4).
