# 🛡️ EPICON Guard

**Git commits tell you WHAT changed. EPICON tells you WHY.**

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue)](./LICENSE)
[![Product: Mobius Systems](https://img.shields.io/badge/Product-Mobius%20Systems-6E00FF)](https://mobius.systems)
[![Status: Pre-Launch](https://img.shields.io/badge/Status-Pre--Launch-orange)](https://epicon.dev)

---

## 🎯 What is EPICON Guard?

**EPICON Guard** is the world's first **Intent Accountability Layer** for Git, developed by [Mobius Systems](https://mobius.systems). It transforms version control from "what changed" to "why it changed" by requiring structured justifications for every code modification.

### The Problem

Traditional Git tracks:
- ✅ **WHAT** changed
- ✅ **WHEN** it changed
- ✅ **WHO** changed it

But not:
- ❌ **WHY** it changed
- ❌ **WHEN** should it expire
- ❌ **WHAT** would make us revert

### The Solution

EPICON Guard adds the missing accountability layer:

```yaml
EPICON INTENT PUBLICATION

ledger_id: acme:payments:stripe-integration
scope: core
mode: normal
issued_at: 2025-12-22T16:00:00Z
expires_at: 2026-01-22T16:00:00Z

justification: |
  Adding Stripe payment integration for credit card processing.
  
  CONTEXT: Current provider (Braintree) has 2.9% fees
  DECISION: Stripe offers 2.4% fees + better fraud detection
  IMPACT: Projected savings of $50k/year
  
counterfactuals:
  - If fraud rate increases >0.5%, revert
  - If A/B test shows worse conversion, stay with Braintree
  - If users report payment issues, disable
```

**Result:** Every code change has documented reasoning, time-bounded authority, and clear success criteria.

---

## 🌟 Key Features

### 1. Intent Publication
Every PR requires a structured justification block explaining WHY, WHAT, HOW, and WHEN.

### 2. Scope Enforcement
Changes are limited to declared scope. Security engineers can't accidentally touch payment code.

### 3. Time-Bounded Authority
All access grants expire automatically. No more zombie permissions or forgotten temporary fixes.

### 4. Counterfactual Conditions
Clear success criteria: "If X happens, then do Y." Removes ambiguity about when to revert.

### 5. Corporate Integrity Index (CII)
Organizations receive an integrity score based on their engineering practices.

### 6. AI Integration (Roadmap)
Intent AI suggests justifications based on code changes. "Copilot for intent."

---

## 🚀 Quick Start

### For Developers

**1. Install GitHub App**
```bash
# Visit github.com/apps/epicon-guard
# Click "Install" and authorize repos
```

**2. Add Intent Block to PR**
```yaml
EPICON INTENT PUBLICATION

ledger_id: myorg:myrepo:feature-name
scope: core | docs | infra | tests
mode: normal | emergency
issued_at: 2025-12-22T10:00:00Z
expires_at: 2026-01-22T10:00:00Z

justification: |
  Your explanation here...
  
counterfactuals:
  - If condition, then action
```

**3. EPICON Validates**
```
✅ Intent Publication Valid
✅ Scope Aligned
✅ Time-Bounded
✅ Counterfactuals Present

Intent Quality Score: 92/100
```

---

## 🏢 For Organizations

### Installation

**GitHub Organization:**
```bash
1. Install EPICON Guard GitHub App
2. Configure scope rules (.epicon/config.yml)
3. Set team permissions
4. Enable dashboard access
```

**Self-Hosted Option:**
```bash
docker-compose up -d
# See docs/self-hosted-setup.md
```

### Dashboard Access

Monitor your organization's integrity:
- 🔴 Expired intents requiring action
- 🟡 Intents expiring soon
- 🟢 Active intents by scope
- 📊 Corporate Integrity Index (CII)
- 📈 Trends over time

---

## 📊 Corporate Integrity Index (CII)

EPICON grades your organization's engineering integrity:

```
Overall Score: 87/100 (A-)
├─ Intent Compliance: 94%
├─ Justification Quality: 88/100
├─ Scope Discipline: 91%
├─ Time Management: 82%
├─ Counterfactual Maturity: 85%
└─ Emergency Usage: 89%
```

**Display Your Badge:**
```html
<img src="https://img.shields.io/endpoint?url=https://epicon.dev/api/badge/yourorg" />
```

**Why Companies Display CII:**
- 🏅 Recruiting: "We're a top 10% integrity company"
- 💼 Sales: "Our engineering practices are certified"
- 📈 Investors: "We have governance maturity"

---

## 💰 Pricing

### Free Tier
- ✅ Public repos
- ✅ Intent validation
- ✅ Basic audit logs (30 days)
- ✅ Community support

### Pro Tier ($10/user/month)
- ✅ Private repos (unlimited)
- ✅ Advanced audit logs (1 year)
- ✅ Custom scope rules
- ✅ Slack/Teams integration
- ✅ CII scoring

### Enterprise Tier ($50/user/month)
- ✅ SSO/SAML
- ✅ Unlimited audit retention
- ✅ Compliance reports (SOC 2, HIPAA)
- ✅ On-premise deployment
- ✅ Dedicated support

### Government Tier (Custom)
- ✅ FedRAMP certified
- ✅ Air-gapped deployment
- ✅ Clearance-aware controls
- ✅ 24/7 support

[View Full Pricing →](https://epicon.dev/pricing)

---

## 🎓 Use Cases

### Junior Developers
"I can read the intent and understand the original decision."

### Senior Engineers
"Future me will thank me for documenting my reasoning."

### Engineering Managers
"I have visibility into which temporary fixes became permanent."

### Enterprises
"SOC 2 audits went from 40 hours to 2 hours of prep."

### Universities
"Students learn to justify technical decisions, not just write code."

### Government
"Complete audit trail for clearance-aware access controls."

---

## 🔌 Integrations

- ✅ **GitHub** - Native app integration
- ✅ **GitLab** - CI/CD pipeline
- ✅ **Jira** - Automatic ticket linking
- ✅ **Slack** - Real-time notifications
- ✅ **Teams** - Collaboration alerts
- 🔄 **Bitbucket** - Coming soon

---

## 📚 Documentation

- [Getting Started](./docs/getting-started.md)
- [Intent Publication Guide](./docs/intent-publication.md)
- [Scope Configuration](./docs/scope-configuration.md)
- [Counterfactual Patterns](./docs/counterfactual-patterns.md)
- [API Reference](./docs/api-reference.md)
- [Self-Hosted Setup](./docs/self-hosted-setup.md)
- [Corporate Integrity Index](./docs/cii-scoring.md)

---

## 🤝 Contributing

We welcome contributions! EPICON Guard is open source (AGPL-3.0).

```bash
git clone https://github.com/epicon-guard/epicon.git
cd epicon
npm install
npm run dev
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    EPICON Guard                          │
├─────────────────────────────────────────────────────────┤
│  Intent Engine    Validation API    Audit Store         │
│  Scope Enforcer   Time Checker      CII Calculator      │
└─────────────────────────────────────────────────────────┘
                          │
                ┌─────────┼─────────┐
                │         │         │
         ┌──────▼───┐ ┌──▼───┐ ┌──▼────┐
         │  GitHub  │ │ GitLab│ │  Jira │
         └──────────┘ └───────┘ └───────┘
```

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for details.

---

## 🛡️ Security & Privacy

**What We Store:**
- ✅ Intent publications
- ✅ Validation results
- ✅ Audit logs

**What We DON'T Store:**
- ❌ Source code
- ❌ Commit diffs
- ❌ API keys or secrets

**Compliance:**
- ✅ SOC 2 Type II (in progress)
- ✅ GDPR compliant
- ✅ FedRAMP (government tier)

See [SECURITY.md](./SECURITY.md) for full policy.

---

## 📊 Status

| Component | Status | Version |
|-----------|--------|---------|
| GitHub App | 🟡 Beta | 0.9.0 |
| GitLab CI | 🟡 Beta | 0.9.0 |
| Web Dashboard | 🟡 Beta | 0.9.0 |
| API | 🟡 Beta | 0.9.0 |
| Intent AI | 🔴 Roadmap | - |
| Self-Hosted | 🟡 Beta | 0.9.0 |

---

## 🌍 Community

- 🌐 **Website:** [epicon.dev](https://epicon.dev)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/epicon-guard/epicon/discussions)
- 🐛 **Issues:** [GitHub Issues](https://github.com/epicon-guard/epicon/issues)
- 📧 **Email:** hello@epicon.dev
- 🐦 **Twitter:** [@epiconguard](https://twitter.com/epiconguard)
- 📝 **Blog:** [blog.epicon.dev](https://blog.epicon.dev)

---

## 🎯 Roadmap

### Phase 1: MVP (Q1 2026)
- ✅ Intent validation engine
- ✅ GitHub App
- ✅ Basic dashboard
- ✅ CII scoring

### Phase 2: Intelligence (Q2 2026)
- 🔄 Intent AI (suggestions)
- 🔄 Pattern detection
- 🔄 GitLab integration
- 🔄 Jira integration

### Phase 3: Enterprise (Q3 2026)
- 🔄 SSO/SAML
- 🔄 Advanced reporting
- 🔄 Self-hosted option
- 🔄 Compliance certifications

### Phase 4: Autopilot (Q4 2026)
- 🔄 Intent Autopilot
- 🔄 Counterfactual monitoring
- 🔄 Automated remediation

---

## 🏢 About Mobius Systems

EPICON Guard is developed by [Mobius Systems](https://mobius.systems), creators of the world's first AI Operating System for Civilization.

**Mobius Mission:** Build governance infrastructure for safe AGI deployment.

**Other Mobius Products:**
- 🛡️ **EPICON Guard** - Intent accountability for Git
- 📋 **Mobius Ledger** - Integrity-backed audit log
- 💎 **MIC Economy** - Integrity-linked currency

[Learn more about Mobius →](https://mobius.systems)

---

## 📜 License

AGPL-3.0 with Ethical Addendum

See [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

Built with integrity by the Mobius Systems team:
- **Michael (Kaizen)** - Founder & Architect
- **ATLAS** - Infrastructure & Operations
- **AUREA** - Integrity Sentinel
- **EVE** - Ethics Engine
- **JADE** - Morale Anchor
- **HERMES** - Market & Signals

Special thanks to all early adopters and contributors.

---

**🛡️ Git commits tell you WHAT changed. EPICON tells you WHY.**

---

*Built by [Mobius Systems](https://mobius.systems) | [epicon.dev](https://epicon.dev)*
