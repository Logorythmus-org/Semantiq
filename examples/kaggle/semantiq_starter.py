"""
SemantIQ Benchmarks - Kaggle Starter Script
Demonstrates loading and analyzing SemantIQ evaluation dataset exports in Kaggle Notebooks.
"""

import json
import pandas as pd

def load_semantiq_dataset(jsonl_path: str) -> pd.DataFrame:
    records = []
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))
    return pd.DataFrame(records)

if __name__ == "__main__":
    print("SemantIQ Benchmarks Kaggle Starter Script Ready.")
