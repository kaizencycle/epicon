# Writing Good Intent Publications

A guide to writing clear, useful intent publications that help your team and future maintainers.

## The Anatomy of a Good Intent

### 1. Clear Ledger ID
```yaml
ledger_id: myorg:myproject:descriptive-name
```

**Good:**
- `acme:payments:stripe-integration`
- `acme:auth:oauth-migration`
- `acme:database:add-user-preferences`

**Bad:**
- `feature` (too vague)
- `fix-123` (not descriptive)
- `update` (what update?)

### 2. Appropriate Scope
```yaml
scope: core | docs | infra | database | security
```

Match your scope to the files you're changing. If you need multiple scopes, consider splitting the PR.

### 3. Meaningful Justification

**Structure:**
```
CONTEXT: Why is this needed?
DECISION: What approach did you choose?
IMPACT: Who/what is affected?
```

**Good Example:**
```yaml
justification: |
  Adding rate limiting to API endpoints.
  
  CONTEXT:
  - Recent DDoS attack caused 2h downtime
  - Current system has no rate limits
  - Security team mandated this as P1
  
  DECISION:
  - Using Redis-based rate limiting
  - 100 requests/minute per IP
  - 1000 requests/minute per authenticated user
  - Rejected nginx rate limiting (need app-level context)
  
  IMPACT:
  - All API endpoints affected
  - Existing integrations may need adjustment
  - Performance overhead: ~5ms per request
```

**Bad Example:**
```yaml
justification: |
  Adding rate limiting because we need it.
```

### 4. Specific Counterfactuals

**Good:**
```yaml
counterfactuals:
  - If legitimate users hit rate limits, increase to 150/min
  - If Redis becomes bottleneck, evaluate local cache
  - If DDoS occurs again, tighten to 50/min
  - Review effectiveness after 30 days
```

**Bad:**
```yaml
counterfactuals:
  - If something goes wrong, fix it
```

## Common Scenarios

### Feature Addition
```yaml
justification: |
  CONTEXT: User research showed 80% want dark mode
  DECISION: CSS-based theme switching (rejected JS library - bundle size)
  IMPACT: All UI components updated, no breaking changes

counterfactuals:
  - If <20% adoption in 30 days, make opt-in instead of default
  - If accessibility issues reported, fix within 1 week
```

### Bug Fix
```yaml
justification: |
  CONTEXT: Users reporting login failures on Safari
  DECISION: Added polyfill for Web Crypto API (Safari 13 missing)
  IMPACT: +2KB bundle size, fixes 15% of userbase

counterfactuals:
  - If Safari usage drops <5%, remove polyfill
  - If bundle size becomes issue, lazy load polyfill
```

### Refactoring
```yaml
justification: |
  CONTEXT: User component has 2000 lines, hard to test
  DECISION: Split into UserProfile, UserSettings, UserActivity
  IMPACT: No behavior change, improved maintainability

counterfactuals:
  - If tests fail in unexpected ways, revert and rethink
  - If team finds new structure confusing, document better
```

### Technical Debt
```yaml
justification: |
  CONTEXT: Quick fix for launch, using setTimeout instead of proper queue
  DECISION: This is TEMPORARY - proper fix tracked in JIRA-1234
  IMPACT: Works but adds 100ms delay, not scalable

counterfactuals:
  - If JIRA-1234 not resolved in 90 days, escalate
  - If this causes issues in production, revert
  - Remove this code when proper queue is implemented
```

## Time-Bounded Intent

### Normal Mode
```yaml
mode: normal
expires_at: 2026-01-22T10:00:00Z  # 30 days typical
```

Use for regular features and changes.

### Emergency Mode
```yaml
mode: emergency
expires_at: 2025-12-25T03:00:00Z  # Max 72 hours
emergency_scope: |
  PRODUCTION OUTAGE: Payment processor timeout
  Incident: INC-5678
```

Use only for production incidents. Requires post-incident review.

## Intent Evolution

When you need to extend or modify an intent:

```yaml
intent_evolution: true
supersedes_hash: abc123...
evolution_reason: |
  Original scope expanded after security review:
  - Added fraud detection hooks
  - Extended timeline by 2 weeks
```

## Quality Checklist

Before submitting:
- [ ] Ledger ID is descriptive
- [ ] Scope matches changed files
- [ ] Justification explains WHY
- [ ] Context is clear
- [ ] Decision rationale included
- [ ] Impact documented
- [ ] At least 2 counterfactuals
- [ ] Expiration date appropriate
- [ ] No sensitive information

## Anti-Patterns

### ❌ Too Vague
```yaml
justification: |
  Updating code for new feature.
```

### ❌ Too Technical
```yaml
justification: |
  Changed line 47 in auth.ts from foo() to bar() and updated
  the import statement to include {bar} from './utils'.
```
(That's what git diff is for!)

### ❌ No Counterfactuals
```yaml
counterfactuals:
  - TBD
```

### ❌ Unrealistic Scope
```yaml
expires_at: 2050-01-01T00:00:00Z  # 25 years!
```

## Tips

1. **Write for your future self** - You'll forget why you made this decision
2. **Include links** - Link to tickets, docs, RFCs
3. **Mention alternatives** - What else did you consider?
4. **Be honest** - If it's technical debt, say so
5. **Think counterfactually** - How would you know if this was wrong?

## Example: Production-Grade Intent

```yaml
EPICON INTENT PUBLICATION

ledger_id: acme:payments:add-apple-pay
scope: core
mode: normal
issued_at: 2025-12-22T10:00:00Z
expires_at: 2026-01-22T10:00:00Z

justification: |
  Adding Apple Pay support for iOS app purchases.
  
  CONTEXT:
  - 40% of users on iOS (50k active users)
  - User surveys show Apple Pay most requested payment method
  - Competitor apps all support Apple Pay
  - Estimated 15% conversion lift based on industry data
  
  DECISION:
  - Using Stripe's Apple Pay integration (vs. native SDK)
  - Reasoning: 
    * Unified payment infrastructure
    * PCI compliance handled by Stripe
    * Easier testing and development
    * Only 0.5% additional fee vs. native
  - Rejected native Apple Pay SDK:
    * Would require separate backend logic
    * More complex PCI compliance
    * Harder to A/B test
  
  IMPLEMENTATION:
  - Backend: Stripe Apple Pay webhook handling
  - Frontend: Apple Pay button in checkout flow
  - Testing: Stripe test cards + TestFlight beta
  
  SECURITY:
  - Security team review completed (approved 2025-12-20)
  - PCI compliance validated by Stripe
  - No card data touches our servers
  - Tokenization handled by Apple/Stripe
  
  ROLLOUT:
  - Week 1: Internal testing (50 users)
  - Week 2: Beta testers (500 users)
  - Week 3: 25% rollout if metrics good
  - Week 4: 100% rollout if metrics good
  
  METRICS:
  - Conversion rate: Target +10% (currently 3.5%)
  - Payment success rate: Target >99% (currently 98%)
  - Support tickets: Expect <10 in first week
  
  APPROVALS:
  - Product: @product-lead (approved)
  - Security: @security-lead (approved)
  - Engineering: @eng-lead (approved)

counterfactuals:
  - If conversion doesn't improve by +5% in week 2, pause rollout
  - If payment success rate drops below 98%, rollback
  - If Stripe fees exceed $5k/month, evaluate native SDK
  - If support tickets exceed 10/week, investigate and fix
  - If Apple policy changes affect implementation, adapt within 30 days
  - Review ROI after 90 days: if not profitable, reconsider

Linked Issues:
- JIRA-1234: Apple Pay integration
- JIRA-5678: iOS payment improvements
- RFC-42: Payment provider strategy

References:
- Stripe docs: https://stripe.com/docs/apple-pay
- Design spec: https://figma.com/...
- Security review: https://docs.internal/...
```

This example shows:
- ✅ Clear context and rationale
- ✅ Decision process documented
- ✅ Alternatives considered
- ✅ Security considerations
- ✅ Rollout plan
- ✅ Success metrics
- ✅ Specific counterfactuals
- ✅ Links to related resources

---

🛡️ **Great intent publications create great engineering culture.**

*Part of Mobius Systems | Built with Integrity*
