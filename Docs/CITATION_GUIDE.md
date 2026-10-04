# Citation Guide

SemantIQ is currently **`0.1.0-alpha.2` — Public Alpha (Experimental)**.

The canonical machine-readable citation metadata is
[`CITATION.cff`](../CITATION.cff). Repository users should prefer the metadata
GitHub renders from that file.

No verified Zenodo deposition, minted DOI, or DataCite registration is established
for the current SemantIQ release state. Do not copy placeholder DOI values into
papers, software metadata, or public citations.

---

## Repository citation fallback

When a DOI or archive identifier is not available, cite the repository and exact
software version used.

### BibTeX

```bibtex
@software{semantiq_2026,
  author  = {{Logorythmus}},
  title   = {SemantIQ: Behavioral Evidence Infrastructure for AI Systems},
  version = {0.1.0-alpha.2},
  year    = {2026},
  url     = {https://github.com/Logorythmus-org/Semantiq}
}
```

### Human-readable form

> Logorythmus. (2026). *SemantIQ: Behavioral Evidence Infrastructure for AI Systems* (Version 0.1.0-alpha.2). GitHub repository.

This fallback identifies the source repository and current software identity. It
does not imply that the software has been deposited with Zenodo or assigned a DOI.

---

## Exact-version citation

For reproducible work, record at least:

- the SemantIQ software version;
- the Git commit SHA used for the evaluation;
- relevant schema/contract versions;
- benchmark or fixture identity;
- model/provider/runtime details needed to reproduce the run.

Software version, schema version, API route version, and benchmark version are
separate identities. A contract or documentation major-version label is not evidence of
a stable SemantIQ software major release.

---

## DOI and archive status

[`.zenodo.json`](../.zenodo.json) and the repository citation metadata are
**archive-preparation metadata**. Their presence is not evidence of:

- a successful Zenodo deposit;
- a minted Version DOI;
- a minted Concept DOI;
- DataCite registration;
- an automatic GitHub-to-Zenodo release workflow.

See [Zenodo GitHub Integration Workflow](ZENODO_DOI_WORKFLOW.md) and
[Version DOI vs Concept DOI Strategy](VERSION_DOI_VS_CONCEPT_DOI.md) for the
prospective archive model and its current evidence boundary.
