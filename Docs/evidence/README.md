# Evidence Engine & Statistical Contrast

**Status**: `NORMATIVE`  
**Target Audience**: Data Scientists, Statisticians, Evidence Evaluators  

---

## Overview

The Evidence Engine performs 7-dimensional matched run pairing, statistical contrast estimation (BCa Bootstrap CI and Exact Sign Test), specification curve analysis, and evidence graph construction.

---

## Documents in this Section

- 🔐 **[Canonicalization Profiles](CANONICALIZATION_PROFILES.md)** (`INTERNALLY_VALIDATED`): Versioned legacy and shared JSON/SHA-256 identity rules, portable vectors, and migration boundaries.
- 🧭 **[Canonicalization Migration Matrix](CANONICALIZATION_MIGRATION_MATRIX.md)** (`ACTIVE_MIGRATION_RECORD`): Evidence-identity classifications, compatibility risks, and per-surface implementation state; Phase 2 is not globally complete.
- 🧾 **[Execution-Receipt Canonicalization Migration](EXECUTION_RECEIPT_CANONICALIZATION_MIGRATION.md)** (`INTERNALLY_VALIDATED`): The bounded V1 opt-in path, exact legacy compatibility rule, fixtures, and fail-closed verification for the first migrated identity surface.
- 🧩 **[ResearchBundle Workspace Canonicalization Migration](RESEARCH_BUNDLE_WORKSPACE_CANONICALIZATION_MIGRATION.md)** (`INTERNALLY_VALIDATED`): Profile-bound V1 identity for the explicitly opted-in Core workspace component, including the profile-stripping correction, fixed fixtures, and unchanged root framing.
- 🧭 **[Second Canonicalization Migration Selection](SECOND_CANONICALIZATION_MIGRATION_SELECTION.md)** (`PLANNING_ONLY`): Post-first-migration risk recalibration, dependency cascades, and the bounded Core workspace-snapshot component selected for Prompt 19.
- 🧩 **[JSON Schema Draft 2020-12 Conformance Evidence](JSON_SCHEMA_CONFORMANCE.md)** (`INTERNALLY_VALIDATED`): Shared pass/fail vectors executed by pinned Ajv, Hyperjump, and python-jsonschema implementations without claiming certification or external validation.
- 📊 **[Matched Statistical Contrast Specification](../RESEARCH_WORKFLOW.md#phase-4-matched-statistical-contrast)** (`NORMATIVE`): 7D matching criteria (model, prompt, temperature, tools, seed, dataset, hardware) and non-parametric estimators.
- 📈 **[Robustness & Specification Curve Diagnostics](../RESEARCH_WORKFLOW.md#phase-5-robustness--specification-curve-analysis)** (`NORMATIVE`): Usable specification stability ($U/T$), low power ratio, and negative control validation.
- 🕸️ **[Evidence Graph & Contrast Reports](../RESEARCH_WORKFLOW.md#phase-3-evidence-graph-construction)** (`NORMATIVE`): Cross-run bipartite relation graph connecting Design Patterns (`DP`) to Failure Patterns (`FP`).
- ⚖️ **[Deterministic Governance Policy Engine](../RESEARCH_WORKFLOW.md#phase-6-evidence-decision-policy)** (`NORMATIVE`): Automated evidence grading (`GRADE_A`..`GRADE_D`) and decision rules.
