# Contributing to EPICON Guard

Thank you for contributing. EPICON Guard is part of [Mobius Substrate](https://mobius-substrate.com).

## Development setup

```bash
git clone https://github.com/kaizencycle/epicon.git
cd epicon
npm install   # optional — workspace dev tooling only
```

### Verify the shipped GitHub Action

These are the tests that exercise the validator consumers install:

```bash
node test/classify.test.mjs      # tier classifier
node test/policy-ref.test.mjs    # base-SHA policy resolution
```

Workspace package tests (guard-core, github-app):

```bash
npm test
```

## Pull requests

Every PR to this repo must include a canonical ` ```intent ` block in the description. This repo is gated by the Guard it ships.

See [README.md](README.md) for the intent block format and tier enforcement semantics.

## Project layout

```
action.yml              # Composite GitHub Action entrypoint
src/validate.mjs        # Action wrapper (delegates to guard-core)
packages/guard-core/    # Shared validation engine
packages/github-app/    # Webhook handler (roadmap surface)
test/                   # Action-level tests
docs/                   # Specs and guides
website/                # GitHub Pages landing page
```

## License

Contributions are licensed under [CC0-1.0](LICENSE) (public domain), matching this repository.

---

*Part of [Mobius Substrate](https://mobius-substrate.com) · "We heal as we walk."*
