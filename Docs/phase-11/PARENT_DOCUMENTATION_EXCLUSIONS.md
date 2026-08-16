# Parent Documentation Exclusions (Prompt 11.8)

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-03

---

## Forbidden Documentation Topics

The following topics are EXCLUDED from the SemantIQ independent documentation set:

| Topic                              | Reason                                                      |
| ---------------------------------- | ----------------------------------------------------------- |
| Tech Club identity                 | Parent organization identity — not part of SemantIQ product |
| Workspace OS                       | Parent platform — no SemantIQ dependency                    |
| Civilization OS                    | Parent platform — no SemantIQ dependency                    |
| Wallet integration                 | Parent domain module — FORBIDDEN import                     |
| Marketplace listing                | Parent domain module — FORBIDDEN import                     |
| Parent workspace architecture      | Internal monorepo structure — not public-facing             |
| Internal research reports          | Private plans — not for public documentation                |
| Private roadmap                    | Internal planning — not for public documentation            |
| Phase 7 publication freeze reports | Obsolete internal admin documents                           |
| Premature release claims           | Phase 12 not yet executed — do not claim publication        |

## Enforcement

The `DocumentationExtractorEngine.auditDocContent()` method programmatically detects all forbidden keywords and rejects any section containing them.
