# Canonical Architecture

SemantIQ defines the evaluation protocol and evidence verification pipeline:

$$\text{Benchmark / Scenario} \longrightarrow \text{Connector Contract} \longrightarrow \text{Optional Execution} \longrightarrow \text{Observation} \longrightarrow \text{Canonical Evidence} \longrightarrow \text{Evaluation} \longrightarrow \text{Report}$$

## Core Pipeline Stages

1. **Benchmark / Scenario**: Standardized task definition and evaluation expectations.
2. **Connector Contract**: Provider-neutral interface to local models (Ollama) or optional cloud LLMs.
3. **Optional Execution**: Sandboxed runtime execution (Docker, OCI, OpenSandbox).
4. **Observation**: Raw event capture from execution environment.
5. **Canonical Evidence**: Normalized, sanitized, and Merkle-tree-hashed evidence trace.
6. **Evaluation**: Multi-perspective rubric evaluation and explainable scoring.
7. **Report**: Machine-readable JSON report and human-readable Markdown summary.
