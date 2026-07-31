# Hugging Face Hub Integration & Publishing Guide

This guide details how to publish **SemantIQ Benchmarks** datasets and benchmark packs to Hugging Face Hub under the **CC0-1.0** open data license.

---

## 1. Export Dataset via SemantIQ Engine

```javascript
import { formatHuggingFaceDataset } from "@tech-club/semantiq";

const subjects = [/* benchmark subjects */];
const hfRecords = formatHuggingFaceDataset(subjects);
```

---

## 2. Publish to Hugging Face Hub

```bash
pip install huggingface_hub
huggingface-cli login
huggingface-cli repo create semantiq-synthetic-smoke --type dataset
git clone https://huggingface.co/datasets/semantiq-benchmarks/semantiq-synthetic-smoke
```
