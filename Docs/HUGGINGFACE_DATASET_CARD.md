---
annotations_creators:
  - synthetic
language_creators:
  - expert-generated
language:
  - en
license:
  - cc0-1.0
multilinguality:
  - monolingual
size_categories:
  - n<1K
source_datasets:
  - original
task_categories:
  - evaluation
  - question-answering
task_ids:
  - evaluation-benchmarks
pretty_name: SemantIQ Benchmarks Synthetic Smoke Dataset
dataset_info:
  features:
    - name: id
      dtype: string
    - name: title
      dtype: string
    - name: content
      dtype: string
    - name: kind
      dtype: string
    - name: version
      dtype: string
    - name: evidence_ids
      sequence: string
---

# SemantIQ Benchmarks Synthetic Smoke Dataset

The **SemantIQ Benchmarks Synthetic Smoke Dataset** is an open, CC0-1.0 Universal benchmark dataset designed for local-first evaluation testing.

## Usage

```python
from datasets import load_dataset

dataset = load_dataset("semantiq-benchmarks/synthetic-smoke")
print(dataset)
```
