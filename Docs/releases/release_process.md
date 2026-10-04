# SemantIQ Release Engineering & Publication Process

**Status**: `NORMATIVE PROCESS`  
**Current software maturity**: Public Alpha (Experimental)  
**Effective evidence refresh**: 2026-10-04

---

## 1. Release philosophy

A SemantIQ release is an evidence-producing event. A tag, version string, passing
test, or metadata file alone is not sufficient publication evidence.

Every public release must bind one reviewed software version, one exact commit
from the intended current release lineage, one immutable Git tag, the validation
evidence for that commit, the artifacts actually published, and the limitations
actually established.

Historical tags are never moved to repair lineage after the fact.

## 2. Versioning and tagging

SemantIQ uses Semantic Versioning for software and PEP 440 spelling for Python
distribution metadata where required.

Prerelease version strings must be selected through an explicit release decision.
Examples are format illustrations, not release commitments.

Before creating a tag, verify that the selected commit is in the intended current
`main` lineage. Do not reuse, delete, or move an existing historical release tag
to represent different source.

## 3. Pre-publication gates

A future release must complete these gates on the **exact selected release
commit**:

1. **Repository state**
   - source/package-boundary cleanup stable;
   - working release commit selected from current `main`;
   - no unresolved release-truth contradiction.

2. **Required GitHub checks**
   - required CI contexts green;
   - security checks green;
   - documentation/link validation green;
   - version-reference audit green.

3. **SDK/package build verification**
   - Python package builds successfully from source;
   - TypeScript SDK builds successfully from source;
   - contract and cross-language parity gates pass.

   Successful local/package builds do not establish PyPI or npm publication.

4. **Runtime evidence**
   - only runtime/provider compatibility directly validated for the release may be
     stated in release notes;
   - optional or migration-bound integrations remain explicitly bounded.

5. **Security and provenance**
   - release notes contain the current security and limitations boundary;
   - generated checksums/SBOM/manifests are verified before being claimed;
   - the tag/signature policy for the new release is explicitly recorded.

6. **Release metadata**
   - version fields are synchronized across approved public metadata surfaces;
   - release notes are generated from current evidence;
   - the exact target commit is cross-checked against the created tag.

7. **External publication evidence**
   - npm/PyPI status is stated from actual registry evidence;
   - Zenodo/DOI status is stated from actual archive evidence;
   - metadata preparation files alone do not count as publication.

8. **Human release approval**
   - maintainer approval occurs after the target commit and release artifacts are
     frozen;
   - publication happens only after the final evidence packet is reviewed.

## 4. GitHub Release requirements

A GitHub Release for a new current-main prerelease must include:

- exact software version and tag;
- exact tag-resolved commit;
- Public Alpha maturity statement;
- concise verified changes;
- known limitations;
- source/package publication status;
- runtime/provider compatibility boundary;
- checksums/assets only when they actually exist and were verified;
- DOI/archive identifiers only when independently verified.

Do not describe source-checkout packages as published npm/PyPI packages.

## 5. Archive and DOI policy

Zenodo/DataCite metadata in the repository is preparation metadata only.

A GitHub tag or release does not, by itself, prove an active archive integration,
successful deposition, DOI issuance, or DataCite registration.

If an archive/DOI is created in the future, verify the external record before
adding the identifier to current citation or release guidance.

## 6. Historical release lineage

The existing alpha.1 and alpha.2 tags belong to a historical lineage that GitHub
currently reports as having no common ancestor with current `main`.

See [Current Release Status](CURRENT_RELEASE_STATUS.md).

Those tags and their historical release records are preserved as provenance.
A future current-main release must use a new reviewed version/tag rather than
mutating historical Git objects.
