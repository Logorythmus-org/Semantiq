# Canonical 18-Stage Evidence Research Workflow

## Overview

SemantIQ provides an end-to-end reference implementation demonstrating how raw agent execution telemetry progresses through statistical contrast, governance decision-making, pre-registration, external execution, and eligibility gating.

This document details the canonical reference flow: **`DP-008` (Out-of-Band Observer)** refuting **`FP-002` (Context Drift)** implemented in [`packages/evidence/src/reference-flow/dp008-reference-flow.ts`](../packages/evidence/src/reference-flow/dp008-reference-flow.ts).

**Evidence boundary:** this is a repository-controlled reference workflow using synthetic/reference records to exercise the implemented mechanics. It is not evidence of a real external partner study, institutional endorsement, independent peer review, or verified third-party replication.

---

## 18-Stage Execution Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 18-STAGE VERTICAL PIPELINE                                  │
│                                                                                             │
│   1. Controlled Run Fixtures  ──►  2. Canonical Adapter      ──►  3. State-Chained Traces   │
│   4. Behavioral Metrics       ──►  5. Failure Observations   ──►  6. Evidence Graph         │
│   7. 7D Matched Contrast      ──►  8. Robustness Diagnostics ──►  9. Specification Curve    │
│  10. Decision Policy (Promote)──► 11. Governed Claim Proposal──► 12. Peer Review (2 Approvals)│
│  13. Release Gate (Active)    ──► 14. Research Bundle        ──► 15. Partner Study Exchange │
│  16. Preregistration Freeze   ──► 17. Manifest Ingestion     ──► 18. Eligibility Gate       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Stage 1: Controlled Run Fixtures
Controlled evaluation runs generate execution records:
- **Treatment Cohort**: Runs executed with active `DP-008` out-of-band monitoring (`host_pty_observer`), yielding 0 drift anomalies.
- **Control Cohort**: Baseline unmonitored execution (`unmonitored_shell`), yielding 5 `FP-002` context drift anomalies.

### Stage 2: Canonical Adapter Ingestion
`BenchmarkEvidenceBridge.adaptTraceArtifact()` ingests raw step logs, translating them into canonical `Run`, `Evaluation`, and cryptographic `Trace` models without fabricating telemetry.

### Stage 3: Cryptographic Trace Chaining
`TraceEvent` records are hashed using SHA-256 into state-chained Merkle sequences (`TraceEventType.TOOL_CALL`).

### Stage 4: Behavioral Metrics Computation
Extracts task performance scores (0.95 treatment vs 0.70 control) and turn latencies.

### Stage 5: Empirical Failure Evidence Extraction
Normalizes observed step anomalies into empirical `EvidenceObservation` items tagged `ObservationCategory.ANOMALY_SIGNAL` with `EpistemicNature.OBSERVED`.

### Stage 6: Evidence Graph Registration
Registers graph nodes for design pattern `pat_dp008` and failure pattern `pat_fp002`, establishing relationship edge `rel_08` (`REFUTES`, weight `0.95`).

### Stage 7: 7-Dimensional Matched Statistical Contrast
`RunProfileMatcher` matches treatment and control runs across 7 covariate dimensions (`environment`, `model`, `population`, `tools`, `memory`, `resource_pressure`, `horizon`). `StatisticalContrastEngine` executes 1,000-resample Bootstrap Confidence Intervals and Exact Sign Tests ($p \le 0.05$).

### Stage 8: Robustness Diagnostics
`RobustnessEngine` verifies covariate balance ($TVD \le 0.05$), runs placebo negative controls, and evaluates leave-out perturbation stability $\to$ `ROBUST_GRADE_A`.

### Stage 9: Specification Curve Analysis
Evaluates directional stability across multiple model/environment subsets confirming 100% directional consistency ($directionStabilityRatio = 1.0$).

### Stage 10: Evidence Decision Policy Evaluation
`EvidenceDecisionPolicy` evaluates statistical power and robustness metrics against governance rules to produce a `"promote"` verdict.

### Stage 11: Governed Claim Proposal & Registration
`ClaimRegistryEngine.draftClaim()` validates statement phrasing against controlled language rules (blocking unsupported causal verbs) and attaches structured evidence references.

### Stage 12: Required Review Records
Records two approved review entries (`review1`, `review2`) evaluating benchmark adherence and metric integrity. The reference flow demonstrates the two-review gate; it does not independently establish reviewer identity, institutional independence, or external peer review.

### Stage 13: Release Gate Authorization
`ClaimRegistryEngine.releaseClaim()` promotes the claim from `draft` to `active`, attaching `EPISTEMIC_LANGUAGE_DISCLAIMER`.

### Stage 14: Reproducible Research Bundle Assembly
`ResearchBundleBuilder` compiles active claims, contrast reports, robustness diagnostics, and workspace snapshots into a Merkle-tree verified bundle (`ResearchBundleManifest`). `ResearchBundleVerifier` cryptographically verifies bundle contents.

### Stage 15: Synthetic Partner-Exchange Registration
`PartnerOrganizationRegistry` and `ReplicationRegistryEngine` register reference fixture identifiers (`org_stanford_nlp`, `study_dp008_stanford_001`) to exercise the partner-exchange contract. These names are synthetic/reference data in the repository flow and do not establish an actual Stanford collaboration, partner relationship, endorsement, or external study.

### Stage 16: Study Protocol Pre-registration & Freezing
`StudyProtocolGenerator` generates the deterministic study protocol with matching specifications and negative controls; `freezeProtocol()` computes an immutable SHA-256 pre-registration fingerprint.

### Stage 17: Reference Execution Manifest Ingestion & Validation
`StudyExecutionManifestValidator` ingests the reference execution manifest and evaluates matching dimensions, negative-control outcomes, and the preregistration hash $\to$ status: `"accepted"`. In this workflow, acceptance demonstrates implemented manifest-validation behavior; it is not evidence that a third party supplied or executed the manifest.

### Stage 18: External-Evidence Gate Mechanics & Reference Aggregation
`ExternalEvidenceEligibilityGate` evaluates all 7 submission criteria $\to$ verdict: `"eligible"`; `ReplicationRegistryEngine` exercises aggregation across the reference organization records while preserving counterevidence visibility. The gate verdict establishes protocol eligibility under the fixture data, not verified external replication or organizational independence.

---

## Running the Reference Workflow

To execute the full reference flow programmatically:

```typescript
import { Dp008ReferenceFlowRunner } from "@semantiq/evidence";

const runner = new Dp008ReferenceFlowRunner();
const result = await runner.executeFlow();

console.log(`Claim ID: ${result.claim.id}`);
console.log(`Decision Verdict: ${result.decisionVerdict}`);
console.log(`Eligibility Verdict: ${result.eligibilityDecision.verdict}`);
console.log(`Replication Support Count: ${result.replicationAggregation.supportCount}`);
```
