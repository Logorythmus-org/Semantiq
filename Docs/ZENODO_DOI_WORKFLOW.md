# Zenodo GitHub Integration Workflow

This document records a prospective Zenodo integration design. Metadata exists, but no verified
deposition, webhook execution, minted DOI, or automatic GitHub-to-Zenodo workflow is established.

---

## Target Automated Pipeline

```text
GitHub Release Created (Tag: v0.1.0-alpha.1)
├── Webhook triggers Zenodo archive worker
├── Zenodo creates immutable release archive zip/tarball
├── Zenodo mints Version DOI (10.5281/zenodo.XXXXX)
├── Zenodo updates Concept DOI (10.5281/zenodo.YYYYY)
└── DataCite metadata synchronized from CITATION.cff / .zenodo.json
```

---

## Local metadata readiness

- `CITATION.cff` and `.zenodo.json` are checked-in metadata inputs.
- Local metadata presence is not Zenodo validation, registration, deposition, or DOI evidence.
- Zero paid subscription requirements; completely open and free.
