# SemantIQ Request for Comments (RFC) Process

**Status**: `NORMATIVE PROCESS`  
**Current maturity**: Public Alpha (Experimental)

---

## 1. Purpose

The RFC process provides a public review path for changes whose consequences
should be understood before implementation.

It complements, but does not replace, protected-branch checks, CODEOWNER review,
security review, tests, or release gates.

## 2. When an RFC is expected

Use an RFC for material changes such as:

- changes to core epistemic invariants or scientific-claim rules;
- breaking canonical contract or schema changes;
- new statistical estimators, robustness methods, or evidence-decision policies;
- substantial architecture or public-interface changes;
- changes to external-evidence eligibility or replication-governance rules;
- security-sensitive governance changes whose policy should be reviewed before code.

An RFC is normally unnecessary for:

- typo, link, and bounded documentation fixes;
- small tests and synthetic fixtures;
- reproducible bug fixes that do not change public semantics;
- small backward-compatible implementation changes whose impact is already clear.

Maintainers may ask a change to move from the Fast path to the Core/RFC path when
its actual impact is broader than initially described.

## 3. Starting an RFC

Start with the
[Architecture / RFC Proposal](https://github.com/Logorythmus-org/Semantiq/issues/new?template=architecture_rfc.yml)
issue form.

The proposal should identify:

- the problem and motivation;
- affected architecture/contracts;
- scientific and epistemic impact;
- security/privacy/resource impact;
- TypeScript/Python compatibility impact where applicable;
- alternatives and unresolved questions;
- the evidence or tests that would be required for implementation.

The repository does not currently maintain a canonical `Docs/rfcs/` directory,
so contributors should not infer approval from creating an RFC-shaped Markdown
file at an arbitrary path.

## 4. Lifecycle

RFCs use these conceptual states:

1. **DRAFT** — proposal is being formed.
2. **UNDER REVIEW** — maintainers and community reviewers are evaluating it.
3. **ACCEPTED** — the direction is approved for implementation.
4. **REJECTED** — the direction is declined with rationale.
5. **WITHDRAWN** — the proposer withdraws it.
6. **IMPLEMENTED** — the approved change has actually merged with its required evidence.
7. **SUPERSEDED** — a later accepted decision replaces it.

Acceptance is not implementation. Implementation is not external validation.
Neither state is a release or production-readiness claim.

## 5. Review and decision authority

The current repository authority is the protected pull-request workflow and the
CODEOWNER mapping to `@Logorythmus-org/semantiq-maintainers`.

This process does **not** currently claim:

- a mandatory fixed public-comment duration;
- separately established domain-owner teams;
- an independently established Maintainers Council;
- unanimous council voting;
- external-partner approval authority.

Such structures may be introduced later, but they must be explicitly created,
documented, and reflected in repository governance before being treated as active.

## 6. Implementation after acceptance

An accepted RFC should be implemented through normal reviewed pull requests with:

- focused scope;
- required tests and CI;
- compatibility/migration notes where needed;
- security and scientific-boundary review where applicable;
- documentation updates;
- release-note updates when release-facing behavior changes.

See [Repository Governance](../../GOVERNANCE.md) and
[Contributing](../../CONTRIBUTING.md).
