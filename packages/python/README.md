# SemantIQ Python SDK (`semantiq`)

> First-class, typed Python SDK and CLI for Autonomous Agent Behavioral Benchmarking, Governed Evidence Claims, and Reproducibility Verification.

[![Python Version](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12-blue.svg)](https://pypi.org/project/semantiq/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Schema Version](https://img.shields.io/badge/Schema-v1.0.0-orange.svg)](https://github.com/Logorythmus-org/Semantiq)

---

## 🚀 Overview

The `semantiq` Python package provides a clean, stable product interface to the SemantIQ evaluation ecosystem. It allows researchers, data scientists, and ML engineers to:
- Execute offline deterministic behavioral benchmark runs.
- Enforce controlled language governance (blocking unhedged causal claims).
- Draft and release governed empirical claims.
- Match treatment/control runs across 7 dimensions and compute statistical contrast (bootstrap CI, exact sign test).
- Export and cryptographically verify self-contained `ResearchBundle` archives with Merkle roots.
- Use zero-boilerplate test fixture generators (`mock_system_profile`, `mock_benchmark`, `mock_case`, `mock_run_profile`).

---

## 📦 Installation

```bash
pip install semantiq
```

Optional extensions:
```bash
pip install semantiq[pandas]   # For pandas DataFrame integration
pip install semantiq[jupyter]  # For Jupyter Notebook visual widgets
pip install semantiq[kaggle]   # For Kaggle dataset submission tools
```

---

## 🛠️ Quickstart

### 1. Offline Deterministic Evaluation

```python
from semantiq import SemantiqClient, mock_system_profile, mock_benchmark, mock_case

client = SemantiqClient(is_offline_deterministic=True)

profile = mock_system_profile(
    id="sys_agent_01",
    name="Financial Advisory Agent",
    capabilities=["tool_calling", "long_context"]
)
benchmark = mock_benchmark(id="bmk_anti_gaming_v1")
case = mock_case(id="case_tool_boundary_01", benchmark_id=benchmark.id)

# Execute evaluation
result = client.evaluate(profile, benchmark, case, deterministic_seed="0x42")

print(f"Run ID:            {result.run.id}")
print(f"Evaluation Status: {result.evaluation.status.value}")
print(f"Overall Score:     {result.evaluation.overall_score}")
print(f"Audit Review:      {result.review.verdict.value}")
```

### 2. Governed Claims & Controlled Language

```python
from semantiq import SemantiqClient

client = SemantiqClient()

# Validate language against epistemic policies
statement = "Heartbeat causes zero downtime."
validation = client.validate_claim_language(statement)
print("Is Valid:", validation.is_valid)  # False - 'causes' is prohibited

# Draft a compliant governed claim
compliant_statement = "Heartbeat monitoring is associated with an 80% decrease in task timeouts."
claim = client.draft_claim(
    statement=compliant_statement,
    topic="resilience_monitoring",
    target_pattern_or_relation_id="DP-001_FP-001",
    run_ids=[result.run.id],
    observation_ids=[result.observations[0].id]
)
print(f"Draft Claim ID: {claim.id} (Status: {claim.status.value})")
```

### 3. Matched Controls & Statistical Contrast

```python
from semantiq import SemantiqClient, mock_run_profile

client = SemantiqClient()

# Match treatment vs control runs across 7 dimensions
treatment_runs = [mock_run_profile(f"t_{i}", is_treatment=True, score=0.92) for i in range(5)]
control_runs = [mock_run_profile(f"c_{i}", is_treatment=False, score=0.65) for i in range(5)]

matched = client.match_controls(treatment_runs, control_runs, target_metric="score")
report = client.evaluate_contrast(target_metric="score", matched_data=matched)

print(f"Mean Delta:       +{report.mean_delta}")
print(f"Bootstrap 95% CI: [{report.bootstrap_ci.lower}, {report.bootstrap_ci.upper}]")
print(f"Evidence Grade:   {report.statistical_evidence_grade}")
```

### 4. Cryptographic Research Bundle Export

```python
from semantiq import SemantiqClient, mock_governed_claim

client = SemantiqClient()
claim = mock_governed_claim()

# Export sealed ResearchBundle
bundle = client.export_research_bundle(
    bundle_id="bundle_2026_q3",
    title="SemantIQ Empirical Evidence Bundle",
    runs=[result.run],
    evaluations=[result.evaluation],
    claims=[claim]
)

# Cryptographic Merkle verification
is_valid = client.verify_bundle(bundle)
print(f"Bundle Verified: {is_valid} (Root: {bundle.merkle_root_hash})")
```

---

## 💻 Command Line Interface (CLI)

The package installs a `semantiq` command-line utility:

```bash
# Evaluate an agent system profile
semantiq evaluate --agent-name "Claude-Agent" --seed "0x42"

# Validate a claim statement against controlled language governance
semantiq validate-language "Dynamic heartbeat is associated with improved stability."

# Verify a cryptographic Merkle root digest
semantiq verify 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08

# Platform information
semantiq info
```

---

## 🔒 Epistemic Invariants

The Python package strictly maintains the core SemantIQ epistemic invariants:
1. **Observed $\neq$ Inferred**: Empirical observations require recorded trace/metric telemetry.
2. **Matched Association $\neq$ Causal Effect**: Statistical contrast reports include mandatory epistemic disclaimers.
3. **Controlled Language**: Unhedged causal verbs (`causes`, `proves`, `guarantees`, `eliminates`, `causal proof`) are rejected.
4. **Deterministic Reproducibility**: Fingerprints and cryptographic Merkle roots guarantee artifact integrity, not scientific proof.

---

## 📄 License

MIT License. Copyright © 2026 Logorythmus / SemantIQ Research Consortium.
