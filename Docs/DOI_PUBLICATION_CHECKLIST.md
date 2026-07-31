# Dry-Run DOI Publication Checklist

This checklist acts as a final validation gate prior to triggering automated Zenodo DOI archiving upon release tag creation in **SemantIQ Benchmarks**.

---

## Verification Gates

- [x] **Format Compliance**: `CITATION.cff` passes CFF 1.2.0 validator.
- [x] **CodeMeta Sync**: `codemeta.json` contains identical title, version, and license attributes.
- [x] **Zenodo Sync**: `.zenodo.json` specifies upload type `software` and MIT license.
- [x] **No Hardcoded Credentials**: Verified zero secrets or private API keys in release files.
- [x] **No-Cost Provider Chain**: Zero paid subscriptions or proprietary services required.
- [x] **Disambiguation**: Version DOI (`v0.1.0-alpha.1`) separated from Concept DOI.

---

## Dry-Run Result

# PASSED — READY FOR AUTOMATED ZENODO ARCHIVING
