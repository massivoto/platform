# PRD: Massivoto Licensing Strategy

**Status:** APPROVED
**Last updated:** 2026-01-23

> - DRAFT: Decision not yet made, options being evaluated
> - APPROVED: License selected, ready for implementation
> - IMPLEMENTED: License files added, headers in place

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | Complete | - |
| Options | Complete | - |
| Decision | **Approved** | Hybrid model |
| Implementation | In Progress | 4/12 |
| **Overall** | **IN PROGRESS** | **33%** |

## Context

Massivoto needs a licensing strategy that:

1. **Readable code**: Developers can inspect, learn from, and trust the code
2. **Free local use**: Anyone can run Massivoto on their machine for free
3. **Self-hosting allowed**: Companies can deploy internally without paying
4. **Block commoditization**: Cloud providers (Hostinger, Vercel, DigitalOcean) cannot offer "one-click Massivoto deployment" without commercial agreement
5. **Community building**: Encourage contributions and adoption
6. **Revenue protection**: Preserve SaaS business model

## Options

### Option A: BSL 1.1 (Business Source License)

**Used by:** MariaDB, CockroachDB, Sentry, HashiCorp (Terraform)

```
License: BSL 1.1
Additional Use Grant: Non-production use, internal business use
Change Date: 4 years after each release
Change License: Apache 2.0
```

| Aspect | Details |
|--------|---------|
| Read code | Yes |
| Local development | Yes |
| Self-host for business | Yes |
| Offer as managed service | No (until Change Date) |
| Fork and compete | No (until Change Date) |
| Becomes open source | Yes, after 4 years |

**Pros:**
- Well-understood, used by major companies (HashiCorp, Sentry, CockroachDB)
- Eventual open source builds trust - shows commitment to community
- Clear legal framework with standardized template
- Allows community contributions under CLA
- Explicit protection against cloud commoditization
- Self-hosting friendly - companies can deploy internally
- No revenue tracking or user counting needed

**Cons:**
- Not OSI-approved (can't call it "open source")
- 4-year wait may frustrate open-source purists
- Some enterprises have blanket BSL bans in procurement policies
- Competitors may fork right before Change Date

> **Note:** "Bait and switch" backlash (like HashiCorp 2023) only applies when switching FROM open source TO BSL. Starting with BSL avoids this entirely.

### Option B: Elastic License 2.0

**Used by:** Elasticsearch, Kibana, Logstash

```
License: Elastic License 2.0
```

| Aspect | Details |
|--------|---------|
| Read code | Yes |
| Local development | Yes |
| Self-host for business | Yes |
| Offer as managed service | No |
| Fork and compete | No |
| Becomes open source | No (never) |

**Pros:**
- Simpler than BSL (no time conversion complexity)
- Battle-tested by Elastic (large-scale adoption)
- Very clear restrictions - easy to understand
- Permanent protection against cloud providers
- No "countdown clock" to worry about

**Cons:**
- Never becomes open source - no trust-building path
- Not OSI-approved - can't market as open source
- Less community goodwill than BSL
- OpenSearch fork showed community may abandon project
- Harder to attract contributors without open-source promise
- Perceived as purely corporate-protective

### Option C: AGPL 3.0 + Commercial

**Used by:** MongoDB (before SSPL), Grafana

```
License: AGPL 3.0 for open source
         Commercial license for SaaS providers
```

| Aspect | Details |
|--------|---------|
| Read code | Yes |
| Local development | Yes |
| Self-host for business | Yes (must share modifications) |
| Offer as managed service | Must open-source entire stack OR buy license |
| Fork and compete | Yes, if they open-source everything |
| Is open source | Yes (OSI-approved) |

**Pros:**
- True open source (OSI-approved) - marketing advantage
- Strong copyleft scares cloud providers (must open their stack)
- Can accept contributions freely without CLA complexity
- Community trust is highest - no "bait and switch" perception
- Grafana model proves it can work commercially
- No license change drama risk

**Cons:**
- AGPL "viral" nature scares many enterprises - legal teams reject
- Doesn't fully block determined competitors (they can comply)
- AWS famously ignores AGPL spirit - enforcement is expensive
- Dual licensing requires careful contribution management
- Some developers refuse to contribute to AGPL projects
- Cloud providers can technically comply by open-sourcing their wrapper

### Option D: Source Available + Proprietary Runtime

```
Platform (apps/, services/, packages/kit): MIT
Runtime (packages/runtime): Proprietary with free local use
```

| Aspect | Details |
|--------|---------|
| Read code | Yes (all) |
| Local development | Yes (runtime free for dev) |
| Self-host for business | Needs runtime license |
| Offer as managed service | Needs runtime license |
| Fork and compete | Can fork MIT parts, not runtime |

**Pros:**
- Maximum control over core IP (runtime)
- Clear separation of free vs paid components
- MIT parts encourage adoption and ecosystem building
- Can change strategy per-component over time
- Protects the "secret sauce" while sharing utilities

**Cons:**
- Split licensing is complex to explain and enforce
- Contributors confused about which license applies
- Less community trust - feels like bait and switch
- Must maintain clear boundaries between components
- Dependency direction must be carefully managed
- Harder to market - "partially open source" is weak positioning

### Option E: Fair Source (FSL)

**Used by:** Sentry (considering), GitButler

```
License: Fair Source License
Use Limitation: 10 users / $1M revenue
```

| Aspect | Details |
|--------|---------|
| Read code | Yes |
| Local development | Yes |
| Self-host for business | Free under threshold, paid above |
| Offer as managed service | Needs license |
| Becomes open source | Yes, after 2 years (Apache 2.0) |

**Pros:**
- Smaller companies and startups use free - lowers adoption barrier
- Only charges successful businesses - fair perception
- Faster open-source conversion (2 years) - builds trust quicker
- Aligned incentives - you pay when you succeed
- Modern approach designed for current SaaS landscape
- Sentry's endorsement adds credibility

**Cons:**
- Newer, less proven in courts
- Threshold enforcement is honor-system - hard to audit
- Revenue tracking is tricky - what counts as "Massivoto revenue"?
- Legal precedent is minimal
- Enterprise legal teams unfamiliar - may reject by default
- User/revenue thresholds can be gamed or misreported

## Comparison Matrix

| Criteria | BSL 1.1 | Elastic 2.0 | AGPL+Commercial | Split License | Fair Source |
|----------|---------|-------------|-----------------|---------------|-------------|
| Code readable | Yes | Yes | Yes | Yes | Yes |
| Local dev free | Yes | Yes | Yes | Yes | Yes |
| Self-host free | Yes | Yes | Yes* | Partial | Yes* |
| Blocks cloud providers | Yes | Yes | Mostly | Yes | Yes |
| OSI-approved | No | No | Yes | Partial | No |
| Community friendly | Good | Okay | Best | Okay | Good |
| Becomes open source | 4 years | Never | Already | Never | 2 years |
| Legal clarity | High | High | Medium | Medium | Medium |
| Enterprise acceptance | Medium | Medium | Low | Medium | Low |

*With conditions

## Decision Criteria

1. **Must block managed service offerings** - Hostinger et al. cannot offer one-click deploy
2. **Must allow free local/dev use** - No barriers to trying Massivoto
3. **Should allow self-hosting** - Companies can run internally
4. **Should build community trust** - Path to open source preferred
5. **Should be legally clear** - Avoid ambiguity
6. **Should allow contributions** - With appropriate CLA

## Decision

**APPROVED: Hybrid Licensing Model**

### Repository Structure

| Repository | License | Purpose |
|------------|---------|---------|
| **massivoto-platform** | Hybrid (see below) | Core platform: runtime, auth, commands, pipes, applets |
| **massivoto-custom** | Apache 2.0 | Template monorepo for companies to extend Massivoto |
| **massivoto-saas** | Proprietary (private) | SaaS business logic - full copyright, hidden |

### massivoto-platform License Structure

| Component | License | Why |
|-----------|---------|-----|
| `packages/runtime` | **BSL 1.1** | Core automation engine - blocks commoditization |
| `packages/kit` | Apache 2.0 | Utilities - encourages adoption |
| `packages/auth` | Apache 2.0 | Auth module - community friendly |
| `packages/*` (commands, pipes, applets) | Apache 2.0 | Standard extensions - community friendly |
| `apps/*` | Apache 2.0 | Frontend apps - community friendly |
| `services/*` | Apache 2.0 | Backend services - community friendly |

### massivoto-custom (Template Repository)

Fully open-source (Apache 2.0) monorepo template that allows companies to:
- Extend Massivoto with custom commands, pipes, and applets
- Keep company code separate from platform code
- Update platform via `git pull` without merge conflicts
- Self-host their customized Massivoto instance

### BSL 1.1 Configuration (for runtime)

```
License: BSL 1.1
Additional Use Grant: Development, testing, personal projects, internal business use
Change Date: 4 years after each release
Change License: Apache 2.0
```

### What This Allows

| Actor | Action | Allowed? |
|-------|--------|----------|
| Developer | Read, run, modify all code locally | Yes |
| Company | Clone massivoto-custom, extend, self-host | Yes |
| Company | Update platform without touching custom code | Yes (git pull) |
| Startup | Build product using Massivoto | Yes |
| Hostinger/Vercel | Offer "one-click Massivoto deploy" | No (needs commercial license) |
| Competitor | Fork runtime and sell as service | No (until Change Date) |
| Contributor | Submit PRs to Apache packages | Yes (no CLA needed) |
| Contributor | Submit PRs to runtime | Yes (CLA required) |

### Pros of Hybrid Model

| Category | Pro |
|----------|-----|
| **Business Protection** | Runtime BSL blocks "Massivoto-as-a-Service" |
| **Adoption** | Apache 2.0 parts encourage ecosystem building |
| **Community** | Most code is truly open source (Apache 2.0) |
| **Contributions** | Apache parts accept PRs without CLA friction |
| **Flexibility** | Can open-source runtime components later if desired |
| **SaaS Protection** | Private repo = zero exposure of business logic |
| **Marketing** | "Open source platform, source-available runtime" |
| **Clean Upgrades** | massivoto-custom separates platform from company code |
| **Easy Onboarding** | Companies clone template, extend, pull updates cleanly |

### Cons of Hybrid Model

| Category | Con | Mitigation |
|----------|-----|------------|
| **Complexity** | Three licenses to explain | Clear CONTRIBUTING.md and LICENSE files per package |
| **Dependency Direction** | Apache parts cannot import BSL internals | Runtime exposes public API; internals stay private |
| **Contributor Confusion** | Which license applies where? | License badge in each package README |
| **Enterprise Review** | Legal must review multiple licenses | Provide license summary doc for procurement |

### Rationale

1. **Best of both worlds** - Open source goodwill + commercial protection
2. **Clear boundaries** - Runtime is the "engine", everything else is ecosystem
3. **SaaS fully protected** - Private repo has no license obligations
4. **Starting fresh** - No "bait and switch" backlash since we're not changing existing licenses
5. **Proven pattern** - Similar to Grafana (AGPL core + Apache plugins) but with BSL

## Open Questions

- [ ] Should runtime have different license than platform?
- [ ] What exact "Additional Use Grant" wording?
- [ ] Do we need a CLA for contributions?
- [ ] Should we have a "startup friendly" tier (free under $X revenue)?
- [ ] Trademark policy separate from code license?

## Requirements

### Implementation

**Last updated:** 2026-01-23
**Progress:** 4/12 (33%)

#### massivoto-platform (this repo)

- [ ] R-LICENSE-01: Add BSL 1.1 LICENSE file in `packages/runtime/`
- [x] R-LICENSE-02: Add Apache 2.0 LICENSE file at repository root (default)
- [ ] R-LICENSE-03: Add Apache 2.0 LICENSE file in each `packages/*` (except runtime)
- [ ] R-LICENSE-04: Add license header to runtime source files (BSL)
- [x] R-LICENSE-05: Create NOTICE file for third-party attributions
- [x] R-LICENSE-06: Document hybrid licensing in root README.md
- [x] R-LICENSE-07: Create CONTRIBUTING.md explaining license per package
- [ ] R-LICENSE-08: Set up CLA bot for runtime contributions only

#### massivoto-custom (new repo)

- [ ] R-LICENSE-09: Create massivoto-custom repository
- [ ] R-LICENSE-10: Add Apache 2.0 LICENSE file at root
- [ ] R-LICENSE-11: Document extension patterns in README.md

#### massivoto-saas (private repo)

- [ ] R-LICENSE-12: Ensure no LICENSE file (full copyright by default)

## References

- [BSL 1.1 Template](https://mariadb.com/bsl11/)
- [Elastic License 2.0](https://www.elastic.co/licensing/elastic-license)
- [Fair Source License](https://fair.io/)
- [HashiCorp BSL FAQ](https://www.hashicorp.com/license-faq)
- [CockroachDB Licensing](https://www.cockroachlabs.com/docs/stable/licensing-faqs.html)
