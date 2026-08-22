# Python Public API Usage Guide (`semantiq`)

## Overview

The `semantiq` Python package provides first-class, type-safe bindings for interacting with SemantIQ Behavioral Evidence Infrastructure from Python environments.

---

## Installation

The provisional `0.1.0-alpha.2` Public Alpha package is not published on PyPI. Install
it from a repository checkout:

```bash
python -m pip install -e "./packages/python"
```

---

## Core Capabilities

### 1. Controlled Language Validation

Ensure claim statements avoid unhedged, unsupported causal language:

```python
from semantiq import validate_claim_language

# Valid associative statement
result = validate_claim_language(
    "DP-008 out-of-band observer is associated with a 0.25 observed increase in goal retention."
)
print(result["is_valid"])  # True

# Invalid causal statement
result = validate_claim_language(
    "DP-008 observer causes complete elimination of drift."
)
print(result["is_valid"])  # False
print(result["violations"])  # ["causes", "elimination"]
```

---

### 2. Governed Claims Lifecycle

Draft and manage scientific claims with explicit evidence links:

```python
from semantiq import SemantiqClient

client = SemantiqClient(is_offline_deterministic=True)

claim = client.draft_claim(
    topic="anti_gaming_drift_mitigation",
    target_pattern_id="rel_08",
    statement="DP-008 out-of-band observer is associated with reduced FP-002 context drift.",
    run_ids=["run_treatment_01", "run_control_01"],
)

print(f"Claim ID: {claim.id}, Status: {claim.status}")
print(f"Epistemic Disclaimer: {claim.epistemic_disclaimer}")
```

---

### 3. Matched Controls & Statistical Contrast

Match treatment and control runs across 7 covariate dimensions:

```python
from semantiq import (
    RunProfile,
    EnvironmentProfile,
    ModelProfile,
    PopulationProfile,
    ToolsProfile,
    MemoryProfile,
    ResourcePressureProfile,
)

treatment_run = RunProfile(
    run_id="run_treat_01",
    is_treatment=True,
    environment=EnvironmentProfile(provider="docker_local", platform="linux", network_isolated=True, os="linux-x86_64"),
    model=ModelProfile(model_family="gpt-4", model_id="gpt-4", temperature=0.0),
    population=PopulationProfile(agent_count=1, topology="single"),
    tools=ToolsProfile(tool_count=5, has_boundary_guard=True, allowed_tool_names=["host_pty_observer"]),
    memory=MemoryProfile(context_window_tokens=8192, has_memory_partitioning=True),
    resource_pressure=ResourcePressureProfile(max_steps=20, token_budget=50000),
    horizon="long",
    outcome_metrics={"goal_retention_score": 0.95},
)

control_run = RunProfile(
    run_id="run_ctrl_01",
    is_treatment=False,
    environment=EnvironmentProfile(provider="docker_local", platform="linux", network_isolated=True, os="linux-x86_64"),
    model=ModelProfile(model_family="gpt-4", model_id="gpt-4", temperature=0.0),
    population=PopulationProfile(agent_count=1, topology="single"),
    tools=ToolsProfile(tool_count=5, has_boundary_guard=True, allowed_tool_names=["unmonitored_shell"]),
    memory=MemoryProfile(context_window_tokens=8192, has_memory_partitioning=True),
    resource_pressure=ResourcePressureProfile(max_steps=20, token_budget=50000),
    horizon="long",
    outcome_metrics={"goal_retention_score": 0.70},
)

# Match and evaluate contrast
match_result = client.match_controls(
    treatment_runs=[treatment_run],
    control_runs=[control_run],
    target_metric="goal_retention_score",
)

contrast = client.evaluate_contrast(
    target_metric="goal_retention_score",
    matched_data=match_result,
)

print(f"Mean Delta: {contrast.mean_delta}")
print(f"Statistical Grade: {contrast.evidence_grade}")
```

---

### 4. Study Protocols & External Eligibility Gating

```python
from semantiq import (
    StudyProtocol,
    StudyExecutionManifest,
    ExternalEvidenceEligibilityGate,
)

gate = ExternalEvidenceEligibilityGate()

# Evaluate partner study submission
decision = gate.evaluate_submission(
    manifest=execution_manifest,
    protocol=frozen_protocol,
    bundle_verification=bundle_verification,
    deviations=[],
    deviation_chain_valid=True,
    organization=partner_org,
)

print(f"Eligibility Verdict: {decision.verdict}")
print(f"Admissible for Aggregation: {decision.is_admissible_for_aggregation}")
```
