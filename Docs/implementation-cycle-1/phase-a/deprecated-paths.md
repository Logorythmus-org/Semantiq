# Deprecated Paths Registry

| Old Path                                 | Authoritative Replacement        | Compatibility Status                             | Removal Eligibility                                                                        |           Remaining Import Count |
| ---------------------------------------- | -------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------: |
| `packages/workflow-runtime/src/index.ts` | `packages/workflow/src/index.ts` | Compatibility re-export with deprecation comment | Eligible after downstream imports migrate and Prompt 3 confirms package boundary ownership | 0 static source imports detected |

Notes:

- The deprecated path remains source-compatible for existing consumers.
- No files were removed for this deprecation.
- New code should import workflow contracts through `packages/workflow` until package export aliases are formalized.

Prompt 3 compatibility note:

- Existing `packages/core` identifiers, event contracts, memory repositories, event bus, and unit-of-work remain authoritative for current core-domain consumers.
- Generic infrastructure contracts are available from `packages/shared`; no existing core import was removed.
