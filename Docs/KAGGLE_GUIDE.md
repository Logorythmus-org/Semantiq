# Kaggle Local Export Guide

SemantIQ contains a local Kaggle-shaped metadata fixture, exporter, and starter script. Repository
tests cover local generation only. Official-tool validation, authenticated upload, namespace
ownership, Kaggle compatibility, and publication have not been established.

---

## 1. Prepare Kaggle Metadata

Use `examples/kaggle/dataset-metadata.json`:

```json
{
  "title": "SemantIQ Benchmarks Synthetic Smoke Dataset",
  "id": "techclub/semantiq-benchmarks-synthetic-smoke",
  "licenses": [{"name": "CC0-1.0"}]
}
```

---

The checked-in `techclub/*` identifier is migration-bound metadata and is not proof of an owned or
published Kaggle dataset.

## 2. Optional manual publication preparation

The following is an operator-controlled future workflow. It is not publication evidence. Validate
the generated files, licensing, provenance, and an authorized namespace before use.

```bash
pip install kaggle
kaggle datasets create -p examples/kaggle/
```
