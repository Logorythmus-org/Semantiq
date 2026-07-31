# SemantIQ Preservation Report

**Date:** 2026-07-22  
**Private artifact root:** `semantiq-preservation-private/` beside this report  
**Scope:** evidence preservation before canonical staging  
**Secret handling:** ignored environment-file contents were not copied into reports or displayed

## Result

Recoverability was established before staging changes began. All three source variants remain in their original locations and retain their pre-existing working states.

## Platform variant (`../SemantIQ`)

- Commit: `e7d9f52`
- Branch: `main`
- Legacy remote recorded privately.
- Complete reachable Git history preserved as `platform/history.bundle`.
- Tracked modifications preserved as a binary-capable patch.
- Five untracked frontend directories preserved in a private ZIP.
- Redacted status, commit graph, tracked-file list, and SHA-256 file manifest recorded.
- Ignored `.env` inventory was recorded by status category; its contents were not reproduced.

## Research variant (`../SemantIQ-M-Benchmarks`)

- Commit: `d42708f`
- Branch: `main`
- Complete reachable Git history preserved as `m-benchmarks/history.bundle`.
- Tracked deletions preserved as a binary-capable patch and status record.
- Commit graph, remote record, tracked-file list, and SHA-256 file manifest recorded.

## Historical variant (`../Sematiq 2`)

- No Git root exists; no history was invented.
- 93 source/configuration/document files received relative-path, length, and SHA-256 records.
- 38 generated/cache/database/log/output files were classified separately.
- The original directory remains untouched and is the authoritative physical preservation copy.

## Integrity anchors

| Artifact | SHA-256 |
|---|---|
| `platform/history.bundle` | `E61874115D42FE15FB96657D4765A3C117EBB3C6DDBDE2077EFBF15B1D172C99` |
| `platform/working-tree.patch` | `604B89EC4D192C99D10900450B5FDF2D49F126B88FF083F72B348C843F70738D` |
| `platform/untracked-files.zip` | `F48A66CA0C5EC7AA907AF6D57786C01655F9B8537AD411D3A26647E4C86B606F` |
| `m-benchmarks/history.bundle` | `DA6765BD265E7F9258817E3AC4D33B53FF4431DAB5286924C1DD202BD4026DAD` |
| `m-benchmarks/working-tree.patch` | `0A90BEBCB72B2FAE2D5EA0D1086D1EC2AA62BE45B787622ACBBD84297641D76B` |
| `sematiq-2/file-manifest.csv` | `58B80CD44779094F9DB3EEF4EBD7EDDE990E1C8A64DFBAEC00CD8A253A61BDAE` |

## Staging method

`SemantIQ-canonical` was cloned locally from the committed ancestry of `../SemantIQ` using a non-hardlinked clone. Branch `foundation/canonicalize-semantiq` was created. The staging `origin` fetch URL points only to the local source checkout and its push URL is set to `DISABLED`. No Logorythmus remote was added.

## Verification

Post-preservation status checks show the platform and M-Benchmarks source working states are unchanged from discovery. The staging repository contains no automatic recovery from either alternate lineage.
