# SemantIQ Request for Comments (RFC) Process

**Status**: `NORMATIVE PROCESS`  
**Maturity**: Public Alpha (Experimental)

---

## 1. Purpose

The RFC process provides a reviewable path for substantial changes before
implementation. It records the problem, proposed design, evidence boundary,
compatibility/security impact, alternatives, and unresolved questions.

An RFC is a governance artifact, not proof that a proposal is correct or that it
will be accepted.

## 2. When an RFC is appropriate

An RFC is normally required or may be requested for:

- changes to core scientific/epistemic invariants;
- breaking changes to canonical product contracts or schemas;
- new scoring, statistical, robustness, or evidence-decision semantics;
- substantial architecture or execution-provider changes;
- new public SDK protocol surfaces;
- changes to external-evidence admission or replication semantics;
- governance/security changes with broad repository impact.

An RFC is normally not required for:

- bounded bug fixes;
- documentation and link repairs;
- small tests or fixtures;
- compatibility reports;
- backward-compatible changes with no material semantic effect.

Maintainers may reclassify a change if its actual impact is broader than first
expected.

## 3. How to start

Use the
[Architecture / RFC Proposal](https://github.com/Logorythmus-org/Semantiq/issues/new?template=architecture_rfc.yml)
issue form, or another issue template when it better matches the domain.

The proposal should include:

1. problem and motivation;
2. affected contracts/components;
3. proposed behavior;
4. scientific/epistemic impact;
5. security/privacy impact;
6. compatibility and migration impact;
7. tests/evidence required for acceptance;
8. alternatives and unresolved questions.

A dedicated `Docs/rfcs/` directory is not required by the current process. If a
proposal needs a durable design record, maintainers may request an ADR or a
normative document before implementation.

## 4. Review lifecycle

The current lifecycle is:

```text
PROPOSED
  -> UNDER REVIEW
  -> ACCEPTED FOR IMPLEMENTATION | REJECTED | WITHDRAWN
  -> IMPLEMENTED (after the approved change merges)
  -> SUPERSEDED (if a later accepted decision replaces it)
```

There is no automatic fixed minimum comment period. Maintainers may keep a proposal
open longer when additional review, external evidence, or compatibility/security
work is needed.

## 5. Acceptance

Acceptance requires the repository's actual governance path:

- proposal scope and evidence are sufficiently documented;
- required reviewers can evaluate the change;
- the implementation PR passes required status checks;
- CODEOWNER/reviewer requirements are satisfied;
- required review threads are resolved;
- the accepted change merges to protected `main`.

The current repository does not require approval from separate domain councils,
partner working groups, or a Maintainers Council unless such authorities are
explicitly established in the future.

## 6. ADR relationship

An ADR records a durable architectural decision. An RFC is the proposal/review
process that may lead to such a decision.

Existing ADRs are repository records. Their presence alone does not automatically
make every historical subsystem or architectural assumption part of the current
supported SemantIQ public boundary.

## 7. External participation

External comments, research input, or integration proposals are welcome, but
participation does not confer repository authority, partnership status, or verified
external-evidence status.

Current repository authority remains defined by
[Docs/GOVERNANCE.md](../GOVERNANCE.md), CODEOWNERS, and live GitHub protection
rules.
