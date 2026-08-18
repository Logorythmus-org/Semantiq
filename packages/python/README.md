# SemantIQ Python Package

Headless Autonomous Agent Behavioral Benchmark & Evidence Verification Infrastructure.

## Installation

```bash
pip install semantiq
```

## Quickstart

```python
from semantiq import SemantiqClient, SystemProfile, Benchmark, Case

client = SemantiqClient(is_offline_deterministic=True)

profile = SystemProfile(
    id="sys_prof_001",
    version="1.0.0",
    name="Deterministic Mock",
    model_family="mock",
    model_id="mock-v1",
    parameters={},
    capabilities=["tool_calling"],
    context_window_tokens=8192,
    created_at="2026-08-18T12:00:00Z"
)

# Run offline deterministic evaluation
result = client.evaluate(profile=profile, benchmark_id="bmk_anti_gaming_suite_v1")
print(f"Evaluation result: {result.evaluation.status}, score: {result.evaluation.overall_score}")
```
