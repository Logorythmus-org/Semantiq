# Governance

SemantIQ is maintained in the public **Logorythmus** GitHub organization.

This document describes the governance that is directly supported by the current
repository configuration. It does not claim a foundation, council, domain-owner
network, or working-group structure unless that structure is separately created
and reflected in the repository's live governance controls.

## Current authority

The repository's canonical code-ownership rule is:

```text
* @Logorythmus-org/semantiq-maintainers
```

from [`.github/CODEOWNERS`](.github/CODEOWNERS).

Current protected-branch governance also requires pull-request review and
CODEOWNER participation before changes are merged into `main`. The detailed
live-evidence baseline is maintained in
[`Docs/security/github_repository_protection.md`](Docs/security/github_repository_protection.md).

## Change paths

SemantIQ uses two contribution paths:

- **Fast contribution path** for bounded documentation, examples, tests,
  reproduction reports, and low-risk fixes.
- **Core change path** for architecture, benchmark semantics, evidence logic,
  scientific claims, governance, security-sensitive behavior, release-critical
  contracts, or breaking public-interface changes.

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## RFCs and material decisions

Material architectural, scientific, contract, governance, and security changes
should use the documented
[RFC process](Docs/governance/rfc_process.md) when the change requires review
before implementation.

An accepted proposal authorizes a direction for implementation. It is not
evidence that the feature is implemented, released, externally validated, or
production-ready.

## Evidence and maturity boundary

SemantIQ is currently **Public Alpha (Experimental)**.

Repository governance may approve:
- code changes;
- documentation changes;
- release decisions;
- evidence-classification decisions;
- public wording within the project's stated scope.

Repository governance does not create universal scientific truth, external
validation, legal certification, adoption, or production reliability by vote.

## Historical governance material

Broader domain-governance models may be retained in `Docs/` as proposed or
historical planning. They are not current GitHub authority unless their teams,
roles, and approval rules are explicitly established in the live repository
configuration.

## Questions

For contribution and support routing, see [`SUPPORT.md`](SUPPORT.md).
