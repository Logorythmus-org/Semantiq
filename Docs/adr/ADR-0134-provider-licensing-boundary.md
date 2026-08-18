# ADR-0134: Provider Licensing Boundary and Clean-Room Isolation Architecture

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

SemantIQ is an independent, provider-neutral benchmark evaluation system distributed under permissive open-source licenses (MIT / Apache-2.0). External execution runtimes encompass a wide variety of legal licenses: permissive open-source (MIT, Apache-2.0, BSD), strong copyleft (GPL-2.0, GPL-3.0), network copyleft (AGPL-3.0), and commercial proprietary EULAs.

To prevent legal contagion, copyleft viral contamination, or unauthorized redistribution claims, SemantIQ Core must maintain strict clean-room isolation from all third-party provider codebases.

---

## Decision

1. **Clean-Room Boundary Invariant**: SemantIQ Core never vendors, clones, forks, or embeds third-party runtime kernels or proprietary SDKs.
2. **Strict Inter-Process & Network Boundaries**: All communication with external execution runtimes occurs exclusively across network RPC (REST, gRPC), standard OCI APIs, or separate process CLI invocations.
3. **Machine-Readable Licensing Manifests**: Require providers to submit `ProviderLicensingManifest` declaring runtime SPDX licenses, copyleft classifications, clean-room status, and third-party attribution notices.
4. **Licensing Boundary Auditor**: Implement `LicensingBoundaryAuditor` to ensure strong copyleft runtimes are accessed strictly across process/network boundaries, rejecting any attempt at dynamic or static linking into core packages.
5. **Automated Attribution Bundling**: Automatically aggregate and compile third-party notices into public benchmark reports via `generateAttributionNoticeBundle`.

---

## Consequences

- SemantIQ Core remains 100% permissively licensed without copyleft contamination or proprietary encumbrance.
- Downstream benchmark authors, academic researchers, and enterprise users can adopt SemantIQ without inheriting restrictive runtime licensing terms.
- Execution providers are cleanly decoupled and independently replaceable at runtime.
