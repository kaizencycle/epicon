# EPICON Guard — Product Specification
## "Git commits tell you WHAT changed. EPICON tells you WHY."

**Version:** 1.0  
**Date:** December 22, 2025  
**Status:** Pre-Launch Specification

---

## 🎯 Executive Summary

**EPICON Guard** is the world's first Intent Accountability Layer for Git, transforming version control from "what changed" to "why it changed." By requiring time-bounded justifications for every code change, EPICON Guard creates an auditable trail of engineering decisions that serves developers, compliance teams, and AI coding assistants alike.

### The Core Insight

**Traditional Git answers:**
- ✅ What changed?
- ✅ When did it change?
- ✅ Who changed it?

**EPICON Guard adds:**
- 🎯 **WHY** was it changed?
- ⏰ **WHEN** does this authority expire?
- 🔄 **WHAT** would make us revert it?
- 🎓 **HOW** does this fit into the architecture?

### Market Opportunity

- **TAM:** $5B (100M developers × $50/year)
- **Initial Target:** Enterprise/Government compliance market
- **Launch Strategy:** Open source core + managed service
- **Unique Position:** First-mover in intent accountability

---

## 🏗️ Product Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    EPICON Guard Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │  Intent Engine │  │ Validation API │  │  Audit Store   ││
│  │                │  │                │  │                ││
│  │ • Parse intent │  │ • Scope check  │  │ • History log  ││
│  │ • Validate     │  │ • Time bounds  │  │ • Query API    ││
│  │ • Store        │  │ • Evolution    │  │ • Reports      ││
│  └────────────────┘  └────────────────┘  └────────────────┘│
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Integration Layer                          │ │
│  │  • GitHub App  • GitLab CI  • Bitbucket  • Self-hosted││ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Intelligence Layer (Future)                │ │
│  │  • Intent AI  • Pattern detection  • Auto-suggest     ││ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Feature Specification

### 1. Intent Publication (MVP)

**User Story:**
> As a developer, I want to document WHY I'm making a change so that future developers (including AI) understand the context.

**Specification:**

```yaml
# Required in PR description:
EPICON INTENT PUBLICATION

ledger_id: <org>:<project>:<identifier>
scope: docs | ci | core | infra | sentinels | labs | specs
mode: normal | emergency
issued_at: <ISO-8601 timestamp>
expires_at: <ISO-8601 timestamp>
justification: |
  Multi-line explanation of:
  - PROBLEM: What problem does this solve?
  - CONTEXT: What's the background?
  - DECISION: What approach was chosen?
  - TRADEOFFS: What alternatives were rejected? Why?
  - IMPACT: Who/what does this affect?
  
counterfactuals:
  - If <condition>, then <action>
  - If <condition>, then <action>
```

**Validation Rules:**

| Field | Required | Format | Validation |
|-------|----------|--------|------------|
| `ledger_id` | ✅ | `<org>:<project>:<id>` | Must be unique per PR |
| `scope` | ✅ | Enum from config | Must match changed files |
| `mode` | ✅ | `normal` or `emergency` | Emergency requires extra fields |
| `issued_at` | ✅ | ISO-8601 with Z | Must be ≤ current time |
| `expires_at` | ✅ | ISO-8601 with Z | Must be > issued_at |
| `justification` | ✅ | Multi-line string | Min 100 chars |
| `counterfactuals` | ✅ | Array of conditions | Min 1 condition |

---

### 2. Scope Enforcement

**Configuration:**

```yaml
# .epicon/config.yml

scopes:
  docs:
    patterns:
      - "docs/**"
      - "*.md"
      - "README.*"
    reviewers:
      - "@tech-writing-team"
    
  core:
    patterns:
      - "src/core/**"
      - "packages/core/**"
    reviewers:
      - "@core-team"
      - "@security-team"
    requires_approval: 2
```

---

### 3. Time-Bounded Authority

**Features:**

**A. Expiration Enforcement**
```yaml
# Intent block
issued_at: 2025-12-22T10:00:00Z
expires_at: 2025-12-29T10:00:00Z  # 7-day window

# EPICON checks:
✅ On PR creation: Validates expires_at is in future
⚠️ On PR update: Warns if <24h remaining
❌ On merge attempt: Blocks if expired
```

**B. Extension Workflow**
```yaml
# If intent needs extension
intent_evolution: true
supersedes_hash: abc123...  # Hash of original intent
evolution_reason: |
  Extension requested because:
  - Original scope expanded after security review
  - Additional testing required
```

---

### 4. Counterfactual Conditions

**Examples:**

**Feature Flag:**
```yaml
counterfactuals:
  - If <100 users adopt in 30 days, remove feature
  - If performance degrades >10%, disable by default
  - If security vulnerability found, disable immediately
```

**Database Migration:**
```yaml
counterfactuals:
  - If migration fails in staging, do not proceed to prod
  - If migration takes >5 minutes, abort and optimize
  - If rollback script fails, escalate to DBA team
```

---

### 5. Corporate Integrity Index (CII)

**Public Integrity Scoring:**

```yaml
┌─────────────────────────────────────────────────────────┐
│  ACME Corp — Corporate Integrity Index                  │
│                                                          │
│  Overall Score: 87/100 (A-)                             │
│  Industry Rank: Top 15% (Tech/SaaS)                     │
│                                                          │
│  Breakdown:                                              │
│  ├─ Intent Compliance: 94% (A)                          │
│  ├─ Justification Quality: 88/100 (B+)                  │
│  ├─ Scope Discipline: 91% (A-)                          │
│  ├─ Time Management: 82% (B)                            │
│  └─ Emergency Usage: 89% (B+)                           │
│                                                          │
│  [Download Report] [Share Badge] [Compare to Industry]  │
└─────────────────────────────────────────────────────────┘
```

---

## 💰 Pricing & Packaging

### Free Tier (Public Repos)
- Intent validation
- Basic audit logs (30 days)
- GitHub/GitLab integration
- Community support
- Up to 10 repos

### Pro Tier ($10/user/month)
- Everything in Free
- Private repos (unlimited)
- Advanced audit logs (1 year)
- Custom scope rules
- Slack/Teams integration
- Priority support
- API access

### Enterprise Tier ($50/user/month)
- Everything in Pro
- SSO/SAML integration
- Unlimited audit retention
- Custom compliance reports
- On-premise option
- Dedicated support
- SLA guarantees (99.9%)

---

## 🚀 Roadmap

### Phase 1: MVP (Months 1-3)
- ✅ Intent validation engine
- ✅ Scope enforcement
- ✅ Time-bound checks
- ✅ GitHub App
- ✅ Basic dashboard

### Phase 2: Intelligence (Months 4-6)
- 🔄 Intent AI (suggestions)
- 🔄 Pattern detection
- 🔄 Quality scoring
- 🔄 GitLab integration

### Phase 3: Enterprise (Months 7-9)
- 🔄 SSO/SAML
- 🔄 Advanced reporting
- 🔄 Self-hosted option
- 🔄 Compliance certifications

### Phase 4: Autopilot (Months 10-12)
- 🔄 Intent Autopilot (auto-generation)
- 🔄 Counterfactual monitoring
- 🔄 Cross-repo analytics

---

## 🔐 Security & Privacy

### Data Handling

**What We Store:**
- ✅ Intent publications
- ✅ Validation results
- ✅ Audit logs
- ✅ User/repo metadata

**What We DON'T Store:**
- ❌ Source code contents
- ❌ Commit diffs
- ❌ API keys or secrets

**Compliance:**
- ✅ SOC 2 Type II (in progress)
- ✅ GDPR compliant
- ✅ CCPA compliant
- ✅ FedRAMP (government tier)

---

## 🎯 Success Metrics

### Year 1 Targets

```
Users
• Free users: 10,000
• Pro users: 500
• Enterprise users: 50

Revenue
• MRR: $250k (Month 12)
• ARR: $3M (run rate)

Product
• Repos enabled: 50,000
• Intents published: 1M+
• Violations caught: 100k+
```

---

## 🤝 Part of Mobius Systems

EPICON Guard is the first commercial product from Mobius Systems:

```
┌─────────────────────────────────────────────────┐
│           MOBIUS SYSTEMS                         │
│     "AI Operating System for Civilization"      │
└─────────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │  EPICON  │ │  Mobius  │ │   MIC    │
  │  Guard   │ │  Ledger  │ │ Economy  │
  └──────────┘ └──────────┘ └──────────┘
```

**EPICON proves Mobius principles work at commercial scale.**

---

*Document Version: 1.0*  
*Last Updated: December 22, 2025*  
*Status: Ready for Implementation*

🛡️ **Git commits tell you WHAT changed. EPICON tells you WHY.**
