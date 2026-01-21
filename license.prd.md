# PRD: Massivoto Licensing Strategy

**Status:** DRAFT
**Last updated:** 2026-01-21

> - DRAFT: Decision not yet made, options being evaluated
> - APPROVED: License selected, ready for implementation
> - IMPLEMENTED: License files added, headers in place

## Progress

| Section | Status | Progress |
|---------|--------|----------|
| Context | Complete | - |
| Options | Complete | - |
| Decision | Not Made | - |
| Implementation | Not Started | 0/5 |
| **Overall** | **DRAFT** | **0%** |

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
- Well-understood, used by major companies
- Eventual open source builds trust
- Clear legal framework
- Allows community contributions

**Cons:**
- Not OSI-approved (can't call it "open source")
- 4-year wait may frustrate purists
- Some enterprises have blanket BSL bans

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
- Simpler than BSL (no time conversion)
- Battle-tested by Elastic
- Very clear restrictions

**Cons:**
- Never becomes open source
- Not OSI-approved
- Less community goodwill than BSL

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
- True open source (OSI-approved)
- Strong copyleft scares cloud providers
- Can accept contributions freely

**Cons:**
- AGPL "viral" nature scares some enterprises
- Doesn't fully block determined competitors
- AWS famously ignores AGPL spirit

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
- Maximum control over core IP
- Clear separation of free vs paid
- MIT parts encourage adoption

**Cons:**
- Split licensing is complex
- Contributors may be confused
- Less community trust

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
- Smaller companies use free
- Only charges successful businesses
- Faster open-source conversion (2 years)

**Cons:**
- Newer, less proven
- Threshold enforcement is honor-system
- Revenue tracking is tricky

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

## Recommendation

**BSL 1.1** with:
- Change Date: 4 years
- Change License: Apache 2.0
- Additional Use Grant: Development, testing, personal projects, internal business use

**Rationale:**
1. Proven by HashiCorp, Sentry, CockroachDB
2. 4-year conversion builds trust and community
3. Clear legal framework
4. Blocks cloud commoditization
5. Allows self-hosting

## Open Questions

- [ ] Should runtime have different license than platform?
- [ ] What exact "Additional Use Grant" wording?
- [ ] Do we need a CLA for contributions?
- [ ] Should we have a "startup friendly" tier (free under $X revenue)?
- [ ] Trademark policy separate from code license?

## Requirements (Post-Decision)

### Implementation

**Last updated:** 2026-01-21
**Progress:** 0/5 (0%)

- [ ] R-LICENSE-01: Add LICENSE file at repository root
- [ ] R-LICENSE-02: Add license header to all source files
- [ ] R-LICENSE-03: Create NOTICE file for third-party attributions
- [ ] R-LICENSE-04: Document license in README.md
- [ ] R-LICENSE-05: Set up CLA bot for contributions (if needed)

## References

- [BSL 1.1 Template](https://mariadb.com/bsl11/)
- [Elastic License 2.0](https://www.elastic.co/licensing/elastic-license)
- [Fair Source License](https://fair.io/)
- [HashiCorp BSL FAQ](https://www.hashicorp.com/license-faq)
- [CockroachDB Licensing](https://www.cockroachlabs.com/docs/stable/licensing-faqs.html)
