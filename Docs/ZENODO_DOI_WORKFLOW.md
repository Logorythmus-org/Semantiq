# Zenodo GitHub Integration Workflow

This document records a **prospective** Zenodo integration design.

Repository metadata exists, but no verified deposition, webhook execution, minted
DOI, DataCite registration, or automatic GitHub-to-Zenodo workflow is currently
established for SemantIQ.

---

## Target automated pipeline

If a future reviewed release is connected to Zenodo, the intended archive flow is:

```text
Reviewed GitHub Release Created (<release-tag>)
├── Authorized Zenodo integration receives the release event
├── Zenodo creates an immutable release archive
├── Zenodo may mint a Version DOI
├── Zenodo may associate a Concept DOI for the project
└── Archive metadata is reconciled with CITATION.cff / .zenodo.json
```

This diagram describes a target workflow, not a workflow verified as active.

---

## Local metadata readiness

- `CITATION.cff` records the current SemantIQ software identity.
- `.zenodo.json` contains archive-preparation metadata.
- Metadata presence is not Zenodo validation, registration, deposition, DOI, or
  publication evidence.
- A GitHub tag or GitHub Release alone does not establish a Zenodo archive.
- A future DOI must be copied into public citation guidance only after the actual
  archive record and identifier have been independently verified.

The current software identity remains **`0.1.0-alpha.2` — Public Alpha
(Experimental)**. This document does not authorize or publish a new release.
