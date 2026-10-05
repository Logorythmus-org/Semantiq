# Releases & Versioning

**Status**: `NORMATIVE`  
**Target Audience**: Release Engineers, Maintainers, Auditors

---

## Overview

This section contains the durable public release surface for SemantIQ. Internal
release-run diaries, prompt packages, handoff notes, local reconciliation reports,
and phase-specific authorization artifacts are not current release evidence.

## Canonical documents

- 🔎 **[Current Release Status](CURRENT_RELEASE_STATUS.md)** (`NORMATIVE`): live GitHub tag/release lineage, current-main relationship, and next-release gate.
- 🏷️ **[Versioning & Release Policy](../VERSIONING_POLICY.md)** (`NORMATIVE`): software identity, schema/API separation, and version-reference rules.
- ⚠️ **[Known Limitations](../KNOWN_LIMITATIONS.md)** (`NORMATIVE`): current Public Alpha validation, scientific, runtime, and release boundaries.
- 🛠️ **[Release Process](release_process.md)** (`NORMATIVE PROCESS`): evidence required before any future release publication.
- ⚖️ **[Multi-Tier Licensing Policy](../../LICENSING.md)** (`NORMATIVE`): licensing boundaries across source code, benchmark definitions, datasets, and documentation.
- 📝 **[Changelog](../../CHANGELOG.md)**: software-change history.
- 📦 **[Release Notes](../../RELEASE_NOTES.md)**: preserved release-facing notes; historical notes are not current release evidence.

## Publication rule

A release claim is current only when it can be tied to the exact selected release
commit, live Git tag/release object, and the artifacts or external publication
records that support the claim.

Historical release documents remain provenance. They must not be silently
rewritten into current evidence, and existing historical tags must not be moved to
match later source history.
