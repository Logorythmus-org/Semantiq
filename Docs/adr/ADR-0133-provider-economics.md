# ADR-0133: Provider Economics and Sustainable Evaluation Architecture

**Status**: Accepted  
**Date**: 2026-08-15

---

## Context

AI evaluation requires sustainable economic foundations spanning community open-source research, grant-subsidized academic benchmarking, commercial pay-as-you-go cloud runners, and enterprise departmental chargeback/showback.

To ensure benchmark legitimacy and long-term sustainability, SemantIQ must decouple benchmark scoring from spending, protect users from runaway cloud bills via hard economic caps, support transparent foundation grants, and preserve zero-cost local execution as a fundamental right.

---

## Decision

1. **Multi-Tier Economic Taxonomy**: Define 5 economic tiers (`COMMUNITY_FREE`, `SPONSORED_GRANT`, `COMMERCIAL_PAYG`, `ENTERPRISE_RESERVED`, `REPLAY_TRACE`).
2. **Deterministic Economic Governor**: Implement `EconomicGovernor` to calculate compute durations, minimum billing floors, data egress, and cold-boot surcharges deterministically.
3. **Cryptographic Execution Receipts**: Issue signed `EconomicExecutionReceipt` manifests with immutable financial breakdowns, grant sponsor attributions, and departmental cost centers.
4. **Evaluation Grant Subsidies**: Support foundation-sponsored credit vouchers (`EvaluationGrantAllocation`) with automated credit decrements and validity checks.
5. **Strict Budget Guardrails & Showback**: Enforce run-level and suite-level `EconomicBudgetCap` hard caps and track departmental consumed budgets (`DepartmentalCostAllocation`).
6. **Decoupling of Economics and Evaluation Rubrics**: Invariant: Benchmark scores are strictly independent of provider tier or financial cost. Free local runs are evaluated with the identical canonical rubric as multi-thousand-dollar cloud clusters.

---

## Consequences

- Open-source and academic researchers can evaluate agents for $0.00 locally or via transparent foundation grants.
- Commercial users gain automated protection against runaway cloud billing during infinite-loop agent failures.
- Enterprises can accurately attribute evaluation infrastructure costs to specific departments and project tags.
- Public benchmark reports include cryptographic provenance of execution economics and sponsor disclosures.
