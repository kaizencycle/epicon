# Getting Started with EPICON Guard

Welcome to EPICON Guard! This guide will help you understand and start using the Intent Accountability Layer for Git.

## What is EPICON Guard?

EPICON Guard transforms Git from tracking **WHAT** changed to also tracking **WHY** it changed. Every code change requires a structured justification that documents:

- **Context:** Why is this change needed?
- **Decision:** What approach was chosen?
- **Impact:** Who/what does this affect?
- **Counterfactuals:** What would make us revert this?
- **Expiration:** When should this be reviewed?

## Quick Start

### 1. Install EPICON Guard

**For GitHub repositories:**
```bash
# Coming soon - GitHub App installation
# Visit: github.com/apps/epicon-guard
```

**For self-hosted / local validation:**
```bash
npm install -g @epicon-guard/cli
```

### 2. Configure Your Repository

Create `.epicon/config.yml`:
```yaml
version: 1

organization:
  name: "myorg"

scopes:
  core:
    patterns: ["src/**"]
    requires_approval: 2
```

### 3. Write Your First Intent

When creating a PR, add this to the description:

```yaml
EPICON INTENT PUBLICATION

ledger_id: myorg:myproject:feature-name
scope: core
mode: normal
issued_at: 2025-12-22T10:00:00Z
expires_at: 2026-01-22T10:00:00Z

justification: |
  Adding user authentication feature.
  
  CONTEXT:
  - Users requested secure login
  - Current system uses basic auth
  - Moving to OAuth 2.0
  
  DECISION:
  - Using Auth0 for implementation
  - Rejected custom solution (maintenance burden)
  
  IMPACT:
  - All users will need to re-authenticate
  - Migration plan: 7-day grace period

counterfactuals:
  - If Auth0 costs exceed $100/month, review
  - If migration causes >5% user complaints, extend grace period
  - Review security audit results after 30 days
```

### 4. EPICON Validates

The EPICON Guard CI check will:
- ✅ Verify intent block is present
- ✅ Check all required fields
- ✅ Validate scope matches changed files
- ✅ Ensure expiration is in the future
- ✅ Confirm counterfactuals exist

### 5. Track and Monitor

After merge, EPICON:
- 📊 Tracks your Corporate Integrity Index (CII)
- ⏰ Monitors expiration dates
- 🔔 Alerts when counterfactuals trigger
- 📈 Provides audit reports

## Key Concepts

### Intent Publication
Every change requires documentation of **why** it's being made. This creates an auditable trail of engineering decisions.

### Scope Enforcement
Changes are limited to declared scopes. Security engineers can't accidentally modify payment code.

### Time-Bounded Authority
All changes have expiration dates. Temporary fixes can't become permanent without review.

### Counterfactual Conditions
Clear criteria for when to revert or modify changes. "If X happens, then do Y."

### Corporate Integrity Index (CII)
Public score showing your organization's commitment to intentional engineering.

## Examples

See the `/examples` directory for templates:
- `basic-intent.yml` - Simple feature addition
- `emergency-hotfix.yml` - Production incident response
- `database-migration.yml` - Schema changes
- `feature-flag.yml` - Feature rollout with metrics

## Next Steps

1. Read the [Product Specification](../PRODUCT_SPEC.md)
2. Review [Intent Writing Guide](../guides/writing-intents.md)
3. Check out [Best Practices](../guides/best-practices.md)
4. Join the community discussion

## Need Help?

- 📖 [Full Documentation](../README.md)
- 💬 [GitHub Discussions](https://github.com/kaizencycle/epicon/discussions)
- 📧 Email: hello@epicon.dev
- 🐛 [Report Issues](https://github.com/kaizencycle/epicon/issues)

---

🛡️ **Git commits tell you WHAT changed. EPICON tells you WHY.**

*Part of Mobius Systems | Built with Integrity*
