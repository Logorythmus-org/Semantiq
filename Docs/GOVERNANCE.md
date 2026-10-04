# SemantIQ Repository Governance

**Status**: `NORMATIVE CURRENT AUTHORITY`  
**Maturity**: Public Alpha (Experimental)

---

## 1. Current repository authority

SemantIQ currently uses a single repository-wide CODEOWNER team:

`@Logorythmus-org/semantiq-maintainers`

The authoritative mapping is
[.github/CODEOWNERS](../.github/CODEOWNERS), which currently covers all paths.

The active GitHub governance path for protected `main` requires pull-request
review, required status checks, CODEOWNER review, an approving review, stale-review
dismissal after new pushes, and review-thread resolution according to the live
repository ruleset.

GitHub settings are the enforcement source. Documentation describes those controls
but does not override them.

---

## 2. Contribution and decision paths

SemantIQ uses two public contribution paths:

### Fast contribution path

Use for bounded documentation, examples, reproduction reports, compatibility
observations, small tests, and fixes that do not change scientific or product
semantics.

A prior RFC is not required. Required CI and CODEOWNER review still apply.

### Core change path

Use for architecture, benchmark semantics, evidence/scoring logic, scientific
claims, governance, security-sensitive behavior, release-critical contracts, or
breaking public API changes.

Core changes require an issue or other reviewable proposal that records scope,
evidence, compatibility/security impact, and acceptance criteria. An RFC or ADR is
used when the change needs a durable design decision.

See [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## 3. Current maintainer model

The repository does **not** currently establish separate staffed domain teams,
Maintainers Council seats, partner working groups, or a foundation as independent
decision authorities.

Historical or prospective documents may discuss such structures. Those designs are
not current governance until they are explicitly approved, created on the public
repository surface, and reconciled with CODEOWNERS and repository rules.

External contributors, organizations, research groups, and integration proposers
may participate in public review. Participation or proposal submission does not
grant maintainer authority or imply partnership/endorsement.

---

## 4. Change acceptance

A repository change is accepted only through the applicable protected-branch
workflow.

For ordinary changes this means:

1. a focused pull request;
2. required CI/status checks;
3. CODEOWNER review;
4. required approving review;
5. resolution of required review threads;
6. merge to protected `main`.

A merge establishes repository acceptance of that change. It does not by itself
establish external validation, scientific truth, production readiness, or a public
release.

---

## 5. RFC and ADR governance

Substantial changes can begin through the
[Architecture / RFC issue form](https://github.com/Logorythmus-org/Semantiq/issues/new?template=architecture_rfc.yml)
or another issue when the domain requires a different evidence template.

The current process does not impose an automatic fixed public comment period or
require approval from councils/domain teams that are not established.

When a durable design decision is required, maintainers may request an ADR or
normative design document before implementation.

See [Request for Comments Process](governance/rfc_process.md).

---

## 6. Scientific and external-evidence boundary

Governance controls whether a change or claim is admitted to the repository. It
does not make the admitted statement universally true.

In particular:

- a maintainer approval is not independent replication;
- a partner/integration proposal is not an established partnership;
- an external-evidence submission is not verified external evidence until the
  applicable provenance/independence review is completed;
- a merged capability is not evidence of adoption or production-scale reliability.

---

## 7. Future governance changes

A future multi-team, council, working-group, or foundation model may be proposed,
but it must be introduced as a reviewed governance change.

Until then, the repository-wide CODEOWNER team and live GitHub protection rules
remain the current authority surface.
