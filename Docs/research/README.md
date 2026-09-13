# Research Workbench & Governed Claims

**Status**: `NORMATIVE`  
**Target Audience**: Researchers, Domain Experts, Authors  

---

## Overview

The Research Workbench manages the complete lifecycle of governed evidence claims, proposal-only evidence watch reconciliation, review ledgers, and reproducible research bundles.

---

## Documents in this Section

- [S-01 Core State Reconciliation](core/S01_CORE_STATE_RECONCILIATION.md) (`EVIDENCE MAP`): Protected-main capability inventory, historical benchmark reconciliation, measurement limits and the next Core gate. Includes the [capability matrix](core/S01_CORE_CAPABILITY_MATRIX.md), [gap register](core/S01_CORE_GAP_REGISTER.md), [machine-readable inventory](../../governance/core-capability-inventory.json) and [inventory schema](../../schemas/core-capability-inventory.schema.json).
- [S-02 Benchmark Registry and Lifecycle](core/S02_BENCHMARK_REGISTRY_AND_LIFECYCLE.md) (`ARCHITECTURE`): Canonical benchmark identity, orthogonal status axes, evidence-gated maturity, lifecycle transitions and representative S-01 migration.
- [S-03 Measurement and Metric Framework](core/S03_MEASUREMENT_AND_METRIC_FRAMEWORK.md) (`ARCHITECTURE`): Canonical metric identity, scale, units, missingness, aggregation, uncertainty, evidence and exact S-02 bindings.
- [S-04 Evaluator Laboratory](core/S04_EVALUATOR_LABORATORY.md) (`ARCHITECTURE`): Canonical evaluator definitions, material configurations, execution outcomes, rubric and model provenance, exact S-02/S-03 bindings and representative evaluator migration.
- [S-05 Benchmark Reliability Laboratory](core/S05_BENCHMARK_RELIABILITY_LABORATORY.md) (`ARCHITECTURE`): Versioned reliability studies, explicit repeat conditions, exact and numeric repeatability, raw categorical agreement, stochastic stability, exclusions, and strict separation from validity.
- [S-06 Human Rater System](core/S06_HUMAN_RATER_SYSTEM.md) (`ARCHITECTURE`): Pseudonymous Human-as-Judge studies, assignments, blinded and reproducibly randomized presentations, rating records, S-04 evaluator conversion, and S-05 handoff.
- [S-07 HIB / Human Benchmark Reconstruction](core/S07_HIB_HUMAN_BENCHMARK_RECONSTRUCTION.md) (`ARCHITECTURE`): Item-level reconciliation of the historical 70-item HIB, pseudonymous Human-as-Subject contracts, a small synthetic research candidate, and explicit pilot and S-08 comparability blockers.
- 🔬 **[Canonical Research Workflow Walkthrough](../RESEARCH_WORKFLOW.md)** (`NORMATIVE`): Complete 18-stage reference pipeline from raw execution logs to cross-organization replication (`DP-008 → FP-002`).
- 📜 **[Governed Claim Lifecycle & Controlled Language](../RESEARCH_WORKFLOW.md#phase-7-governed-claims--controlled-language)** (`NORMATIVE`): Claim statuses (`DRAFT`, `PROPOSED`, `REVIEWED`, `RELEASED`, `REJECTED`) and required epistemic disclaimers.
- 👁️ **[Evidence Watch & Active-Claim Reconciliation](../RESEARCH_WORKFLOW.md#phase-9-evidence-watch--reconciliation)** (`NORMATIVE`): Proposal-only review queue; zero automatic mutation of active released claims.
- 📦 **[Reproducible Research Bundles & Merkle Sealing](../RESEARCH_WORKFLOW.md#phase-11-reproducible-research-bundles)** (`NORMATIVE`): Self-contained, portable `.bundle.json` archives sealed with SHA-256 Merkle tree proofs.
- 🔁 **[Independent Replication Guide](../REPRODUCTION_WALKTHROUGH.md)** (`REVIEWED`): Exact source revision, environment metadata, artifacts, hashes, divergences, sanitization, and maintainer classification. A successful attempt is not automatically verified external replication.
- 🕸️ **[Integration Graph](../ecosystem/INTEGRATION_GRAPH.md)** (`EVIDENCE MAP`): Repository-supported runtime, storage, execution, exchange, experimental, and migration-bound relationships.
