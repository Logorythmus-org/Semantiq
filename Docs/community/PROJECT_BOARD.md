# Contributor Project Board Model

This document defines a lightweight GitHub Projects model for SemantIQ.

The board represents **current coordination state**. It does not create a release commitment, implementation claim, external-validation claim, or delivery guarantee.

## Recommended fields

### Status

- **Inbox** — newly captured, not yet triaged
- **Ready** — scoped enough for someone to start
- **In Progress** — active work
- **Review** — pull request, evidence, or maintainer review in progress
- **Blocked** — dependency or decision prevents progress
- **Done** — repository-defined acceptance is complete

### Workstream

- Community & Docs
- Reproduction
- Integrations & Compatibility
- Benchmark Packs
- Core Engineering
- SDKs & API
- Security
- Governance & Research
- Release

### Contribution Path

- Fast
- Core

### Difficulty

- Good First Contribution
- Intermediate
- Advanced / Core Review

### Evidence State

Use only where meaningful:

- Proposed
- Implemented
- Internally Validated
- External Evidence Submitted
- External Evidence Verified

Do not infer one state from another.

### Priority

- P0 — blocking/security/release-critical
- P1 — high-value active work
- P2 — normal backlog
- P3 — exploratory / later

## Recommended views

### New Contributors

Filter:

- Status = Ready
- Contribution Path = Fast
- Difficulty = Good First Contribution or Intermediate

This should be the primary public entry view.

### Reproduction & Compatibility

Show independent reproduction, clean-environment validation, integration compatibility, and benchmark execution tasks.

### Current Engineering

Show Ready / In Progress / Review for Core Engineering, SDKs & API, Benchmark Packs, and Security.

### Community & Documentation

Show documentation, examples, onboarding, Wiki, Discussions, and contributor-experience work.

### Blocked

Show every blocked item with the blocking dependency visible.

### Done — Recent

Show recently completed work for public project activity without treating completion as adoption or external validation.

## Item hygiene

Every Ready item should answer:

1. What problem is bounded?
2. What files/surfaces are likely involved?
3. What does done mean?
4. Which contribution path applies?
5. Which validation commands are expected?
6. Is prior discussion/RFC/security review required?

If those answers are missing, keep the item in Inbox.

## Good first contribution standard

A Good First Contribution should:

- be independently understandable;
- avoid hidden architecture decisions;
- have a bounded expected outcome;
- identify the validation path;
- be safe to abandon without blocking the project;
- normally fit the Fast contribution path.

Do not label broad refactors, ambiguous research questions, or security-sensitive changes as good first contributions merely to increase issue count.

## Suggested initial board items

- Validate one documented quickstart on a clean machine and report friction.
- Reproduce one canonical example from an exact commit.
- Submit one OS/runtime compatibility report.
- Improve one documentation path with a failing link or stale command.
- Add one focused regression test for a documented edge case.
- Propose one openly licensed benchmark pack with a minimal fixture.
- Review one integration guide against the currently implemented surface.

These are participation patterns, not claims that the corresponding issues already exist.
