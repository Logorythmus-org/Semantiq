# Kaggle Dataset & Notebook Integration Guide

This guide details how to publish **SemantIQ Benchmarks** evaluation datasets and starter notebooks to Kaggle under **CC0-1.0** open licenses.

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

## 2. Publish to Kaggle Datasets

```bash
pip install kaggle
kaggle datasets create -p examples/kaggle/
```
