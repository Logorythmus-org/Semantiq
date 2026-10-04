# Current Release Status

**Status**: `NORMATIVE CURRENT-EVIDENCE INDEX`  
**Audit date**: 2026-10-04  
**Software identity**: `0.1.0-alpha.2` — Public Alpha (Experimental)

This document records the GitHub release/tag evidence captured during the 2026-10-04 audit. It does not publish a release, move a tag, or convert historical release records into current evidence. The exact `main` SHA below is an audit baseline and may be superseded by later protected-main merges.

## Audited main baseline

At the time of the 2026-10-04 release-surface audit, protected `main` resolved to:

```text
c05d2c729e8da929b59b0672e80884094118a3de
```

Source metadata uses `0.1.0-alpha.2` (Python: `0.1.0a2`). That source identity is provisional and does **not** mean that the audited or later `main` is identical to the existing `v0.1.0-alpha.2` tag.

## Existing prerelease tags

| Tag | Resolves to commit | Git relation to audited `main` baseline | Tag verification |
| --- | --- | --- | --- |
| `v0.1.0-alpha.1` | `870f70f900748a79aed8e959ebb0b618ff4329cc` | No common ancestor found by GitHub compare | unsigned |
| `v0.1.0-alpha.2` | `a94e99d07441e2115b4a770f46851dff7c8fe77a` | No common ancestor found by GitHub compare | unsigned |

The alpha.2 tag is five commits ahead of alpha.1 on their historical tag lineage.

The existing tags are preserved historical Git objects. They must not be moved or
retagged to make the current repository history appear linear.

## Published GitHub Releases

The live GitHub Releases surface currently contains one release:

- `v0.1.0-alpha.1`
- marked as a prerelease;
- no manually attached release assets.

No GitHub Release currently exists for `v0.1.0-alpha.2`.

## Historical alpha.1 record discrepancy

The published alpha.1 release body names:

```text
Release Target Commit:
0bd663d1da2d420ead170de78cd67bc0f4224962
```

but the live annotated tag resolves to:

```text
870f70f900748a79aed8e959ebb0b618ff4329cc
```

The same release body references:

```text
Docs/release/github-publication-manifest.json
```

That path is not present at the alpha.1 tag. The live GitHub Release also contains
no attached assets.

These are historical record inconsistencies. They are documented here instead of
being silently rewritten.

## Gate for the next current-main prerelease

A future release intended to represent the current repository line must not reuse
or move an existing historical tag. Before publication:

1. stabilize the source/package boundary;
2. select an exact release commit from the current `main` lineage;
3. complete all required CI, security, contract, documentation, and version-truth
   checks on that exact commit;
4. choose a **new** prerelease version/tag through explicit release review;
5. regenerate release notes from the selected commit rather than copying alpha.1;
6. build and verify any checksums, SBOMs, manifests, or archives that will be
   publicly claimed;
7. state npm/PyPI publication status from actual registry evidence;
8. state DOI/archive status from actual archive evidence;
9. preserve the Public Alpha limitations and non-certification boundary;
10. obtain human approval after the target commit and artifacts are frozen.

The exact next version is a separate release decision. This document does not
authorize publication.
