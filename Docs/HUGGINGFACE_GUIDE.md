# Hugging Face Local Export Guide

SemantIQ can generate local records and dataset-card metadata shaped for later Hugging Face review.
Repository tests cover local generation only. Official-tool validation, authenticated upload, Hub
compatibility, and publication have not been established.

---

## 1. Export Dataset via SemantIQ Engine

```javascript
import { formatHuggingFaceDataset } from "@tech-club/semantiq";

const subjects = [/* benchmark subjects */];
const hfRecords = formatHuggingFaceDataset(subjects);
```

---

## 2. Optional manual publication preparation

The following commands are an operator-controlled future workflow, not evidence that a SemantIQ
dataset has been published. Review generated data, licensing, provenance, namespace ownership, and
the current Hugging Face tooling before attempting it.

```bash
pip install huggingface_hub
huggingface-cli login
huggingface-cli repo create semantiq-synthetic-smoke --type dataset
git clone https://huggingface.co/datasets/semantiq-benchmarks/semantiq-synthetic-smoke
```
