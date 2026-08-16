# Zenodo GitHub Integration Workflow

This document records the automated integration workflow between GitHub Releases and Zenodo for assigning DOIs to **SemantIQ Benchmarks**.

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

## Dry-Run Readiness Verification

- `CITATION.cff` validated format compliance.
- `.zenodo.json` contains complete metadata (title, description, license, keywords).
- Zero paid subscription requirements; completely open and free.
