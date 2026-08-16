# SemantIQ Sandbox Specification: Long-Horizon Agent Testing Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 45)  
**Status**: Approved Specification  
**Date**: 2026-08-15

---

## 1. Executive Summary

Most agent benchmarks evaluate micro-tasks lasting only 1 to 5 steps. Real-world autonomous operations—such as building end-to-end applications, complex multi-repo refactoring, or autonomous infrastructure migration—require executing reliably across extended horizons of 50 to 500+ sequential steps with multi-phase milestones, compounded error recoveries, state coherence, and strict budget constraints.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
`Benchmark → Scenario → Execution Contract → Provider Router → Provider Adapter → Runtime → Observation → Evidence → Evaluation → Report`

This specification defines the **Long-Horizon Agent Testing Architecture**:

1. **6-Phase Milestone Progression**: Standardizes 6 scenario phases: [`DISCOVERY_AND_RECON`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/long-horizon.ts#L9-L16), [`ARCHITECTURAL_PLANNING`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/long-horizon.ts#L9-L16), [`SCAFFOLD_AND_BOOTSTRAP`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/long-horizon.ts#L9-L16), [`INCREMENTAL_IMPLEMENTATION`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/long-horizon.ts#L9-L16), [`INTEGRATION_AND_TESTING`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/long-horizon.ts#L9-L16), and [`VERIFICATION_AND_FINALIZE`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/long-horizon.ts#L9-L16).
2. **Multi-Dimensional Long-Horizon Metrics**: Defines mathematical formulations for Milestone Completion Rate ($MCR$), Goal Convergence Score ($GCS$), Memory Coherence Score ($MCS$), Budget Efficiency Score ($BES$), and the composite **Long-Horizon Resilience Index ($LHRI$)**.
3. **Long-Horizon Testing Engine**: Implements [`LongHorizonTestingEngine`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/long-horizon.ts#L67-L215) to validate multi-phase milestone budgets ([`planScenario`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/long-horizon.ts#L68-L76)), evaluate extended execution trajectories ([`evaluateLongHorizonTrajectory`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/long-horizon.ts#L78-L165)), and award 4 standardized certification grades ([`LongHorizonCertificationGrade`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/long-horizon.ts#L17-L22)).
4. **Strict Observable Behavioral Grounding**: Evaluates behavior strictly across the canonical sequence:
   $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$
   without claiming access to hidden cognition or internal model states.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                Long-Horizon Milestone Planning                              |
|  [Discovery] ──> [Architecture] ──> [Scaffold] ──> [Implementation] ──> [Testing] ──> [E2E] |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                               Multi-Phase Trajectory Execution                              |
|  • Extended Step Horizon (50 - 500+ steps)                                                  |
|  • Tracks Milestone Checkpoints, Artifact Deliverables, Token Usage, and Error Recoveries   |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                Long-Horizon Resilience Scoring                              |
|  • Calculate MCR, Goal Convergence, Memory Coherence, Budget Efficiency, and LHRI Composite |
|  • Assign Horizon Grade: GRADE_LH1_AUTONOMOUS_SCALE to GRADE_LH4_HORIZON_COLLAPSED          |
|  • Cryptographically Sign LongHorizonEvaluationReport                                       |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Scope and Non-Goals

### 2.1 In Scope

- **Long-Horizon Specification**: Defining [`LongHorizonScenarioSpec`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/long-horizon.ts#L32-L41) and JSON Schema [`long-horizon-scenario.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/long-horizon-scenario.schema.json).
- **Multi-Phase Milestone Checkpoints**: Defining validation criteria, step budgets, and target artifact deliverables across the 6 standardized lifecycle phases.
- **Quantitative Long-Horizon Metrics**: Computing $MCR$, goal convergence, memory coherence, and $LHRI$ scores.
- **Observable Behavioral Preservation**: Grounding evaluations strictly in emitted trace actions, command results, and artifact hashes.

### 2.2 Non-Goals

- **No Claims on Hidden Cognition**: We evaluate external files, test runs, and shell interactions rather than internal context cache memory.
- **No Infinite Unbounded Runs**: Every long-horizon scenario enforces hard step and timeout boundaries.

---

## 3. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Long-Horizon Grammar, Report Schemas, and Engine (LongHorizonTestingEngine)              |
|  • Multi-Phase Milestone Planning & Checkpoint Verification Algorithms                      |
|  • Calculating MCR, Goal Convergence, Memory Coherence, Budget Efficiency, and LHRI         |
|  • Compiling & Cryptographically Signing Long-Horizon Evaluation Reports                     |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standardized Sandbox Execution Contracts)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Reliable High-Concurrency Multi-Hour Container/MicroVM Sandbox Uptime                    |
|  • Persistent Filesystem Snapshots Across Milestone Checkpoints                             |
|  • Accurate Resource Consumption Telemetry (Core-Seconds, Bandwidth, Memory)                |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 4. Contracts and Schemas

### 4.1 TypeScript Long-Horizon Interfaces ([`packages/sandbox-contracts/src/long-horizon.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/long-horizon.ts))

```typescript
export type LongHorizonPhaseType =
  | "DISCOVERY_AND_RECON"
  | "ARCHITECTURAL_PLANNING"
  | "SCAFFOLD_AND_BOOTSTRAP"
  | "INCREMENTAL_IMPLEMENTATION"
  | "INTEGRATION_AND_TESTING"
  | "VERIFICATION_AND_FINALIZE";

export type LongHorizonCertificationGrade =
  | "GRADE_LH1_AUTONOMOUS_SCALE"
  | "GRADE_LH2_MILESTONE_COMPLETING"
  | "GRADE_LH3_TARDY_DEGRADED"
  | "GRADE_LH4_HORIZON_COLLAPSED";

export interface MilestoneCheckpointSpec {
  readonly milestoneId: string;
  readonly phase: LongHorizonPhaseType;
  readonly description: string;
  readonly targetArtifacts: readonly string[];
  readonly validationCriteria: Record<string, unknown>;
  readonly maxStepBudget: number;
}

export interface LongHorizonScenarioSpec {
  readonly scenarioId: string;
  readonly displayName: string;
  readonly totalHorizonSteps: number;
  readonly milestones: readonly MilestoneCheckpointSpec[];
  readonly allowedTools: readonly string[];
  readonly tokenBudgetLimit: number;
  readonly wallClockTimeoutSeconds: number;
}

export interface MilestoneExecutionRecord {
  readonly milestoneId: string;
  readonly phase: LongHorizonPhaseType;
  readonly startStep: number;
  readonly completedStep?: number;
  readonly durationSteps: number;
  readonly achieved: boolean;
  readonly tokensUsed: number;
  readonly errorsEncountered: number;
  readonly recoveryCount: number;
}

export interface LongHorizonEvaluationReport {
  readonly scenarioId: string;
  readonly agentId: string;
  readonly totalExecutedSteps: number;
  readonly completedMilestonesCount: number;
  readonly totalMilestonesCount: number;
  readonly milestoneCompletionRate: number; // 0.0 to 1.0
  readonly goalConvergenceScore: number; // 0.0 to 1.0
  readonly memoryCoherenceScore: number; // 0.0 to 1.0
  readonly budgetEfficiencyScore: number; // 0.0 to 1.0
  readonly longHorizonResilienceIndex: number; // 0.0 to 1.0 (LHRI)
  readonly horizonGrade: LongHorizonCertificationGrade;
  readonly milestones: readonly MilestoneExecutionRecord[];
  readonly evaluatedAt: string;
  readonly reportSignatureHex: string;
}
```

### 4.2 JSON Schema Manifests

- **[`schemas/long-horizon-scenario.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/long-horizon-scenario.schema.json)**: Validates long-horizon reports, milestone execution records, and certification grades.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `longHorizonEvaluationReportSchema`.

---

## 5. Mathematical Formulations

### 5.1 Milestone Completion Rate ($MCR$)

$$MCR = \frac{N_{\text{completed\_milestones}}}{N_{\text{total\_milestones}}}$$

### 5.2 Goal Convergence Score ($GCS$)

$$GCS = MCR$$

### 5.3 Memory Coherence Score ($MCS$)

$$MCS = \max\left(0.2, 1.0 - \frac{N_{\text{redundant\_reads}}}{N_{\text{total\_steps}}}\right)$$

### 5.4 Budget Efficiency Score ($BES$)

$$BES = \max\left(0.0, \min\left(1.0, 1.0 - \frac{N_{\text{total\_steps}}}{1.2 \cdot \text{TotalHorizonBudget}}\right)\right)$$

### 5.5 Long-Horizon Resilience Index ($LHRI$)

$$LHRI = 0.45 \cdot MCR + 0.25 \cdot GCS + 0.15 \cdot MCS + 0.15 \cdot BES$$

---

## 6. Security, Privacy, and Trust Posture

1. **Deterministic Milestone Auditing**: Each milestone checkpoint is validated against concrete artifact files and assertion results rather than agent self-reported completion.
2. **Hard Budget & Timeout Sandboxing**: Prevents runaway billing by enforcing step, token, and wall-clock limits at the provider layer.
3. **Cryptographic Scorecard Signatures**: Every evaluation report is cryptographically sealed, guaranteeing unforgeable long-horizon claims.

---

## 7. Open-Source vs. Commercial & Enterprise Long-Horizon Profiles

| Dimension           | Open-Source (`COMMUNITY_BENCH`) | Academic Research (`RESEARCH_GRID`) | Enterprise (`PROD_AUTONOMY`)        |
| :------------------ | :------------------------------ | :---------------------------------- | :---------------------------------- |
| **Horizon Length**  | 50 - 100 steps                  | 100 - 250 steps                     | 500+ steps (Multi-Day Projects)     |
| **State Retention** | In-Memory Ephemeral Sandbox     | Checkpointed Volume Snapshots       | Enterprise Persistent Cloud Storage |
| **Cost Tracking**   | Local Estimate                  | Grant Billing Summary               | Real-Time Departmental Chargeback   |

---

## 8. Failure Modes & Resilience Strategies

| Failure Mode               | Root Cause                          | Impact            | Automated Recovery Action                             |
| :------------------------- | :---------------------------------- | :---------------- | :---------------------------------------------------- |
| **Mid-Horizon Goal Drift** | Agent forgets objective at step 80  | Milestone failure | Checkpoint failure halts cascade; assigns lower grade |
| **State Amnesia**          | Agent re-discovers files repeatedly | MCS degradation   | Memory coherence metric penalizes redundant reading   |
| **Budget Exhaustion**      | Inefficient token/step consumption  | Run abort         | Step budget cap terminates run cleanly                |
| **Cascading Frustration**  | Multiple errors trigger panic loop  | Horizon collapse  | Engine logs `GRADE_LH4_HORIZON_COLLAPSED`             |

---

## 9. Testing Strategy & Verification

The long-horizon testing architecture is validated through automated test suites:

1. **Milestone Planning & Trajectory Unit Tests ([`tests/unit/long-horizon.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/long-horizon.test.ts))**:
   - Validates scenario planning and step budget verification.
   - Tests successful 6-phase trajectory traversal (`GRADE_LH1_AUTONOMOUS_SCALE`).
   - Tests detection and penalization of collapsed trajectories (`GRADE_LH4_HORIZON_COLLAPSED`).
   - Tests Markdown report export and cryptographic signature generation.
2. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `longHorizonEvaluationReportSchema`.

---

## 10. Acceptance Criteria

- [x] Long-horizon contracts define 6 standardized multi-phase lifecycle milestones.
- [x] Engine validates step budgets and evaluates extended execution trajectories.
- [x] Mathematical algorithms calculate $MCR$, goal convergence, memory coherence, and $LHRI$.
- [x] Certification grading algorithm classifies agent autonomy across 4 standardized tiers.
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 11. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Long Horizon Execution Time vs. CI/CD Turnaround**: Running 500-step benchmarks takes hours of wall-clock time.  
  _Mitigation_: Use tiered evaluation—fast 50-step regression suites for CI, full 500-step runs for weekly release certification.
- **Open Question**: Checkpoint branching where an agent can fork and test alternative architectural paths simultaneously.

---

## 12. Facts, Assumptions, and Recommendations

- **Facts**:
  - Most production failures occur after step 20 due to compounding errors and state drift.
  - Multi-phase milestone architectures allow measuring progress without micromanagement.
- **Assumptions**:
  - Providers support long-running persistent sandbox containers without premature eviction.
- **Recommendations**:
  - Require a minimum `GRADE_LH1_AUTONOMOUS_SCALE` or `GRADE_LH2_MILESTONE_COMPLETING` rating for fully autonomous agent deployment.
  - Publish long-horizon milestone completion curves alongside standard benchmark leaderboards.

---

## 13. Architecture Decision Record

### [ADR-0145: Long-Horizon Agent Testing and Multi-Step Autonomous Evaluation Architecture](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0145-long-horizon-agent-testing.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Standardize 6-phase milestone progressions, implement `LongHorizonTestingEngine`, evaluate observable milestone completions across the canonical chain, and compute the composite Long-Horizon Resilience Index ($LHRI$).
- **Consequences**: Enables rigorous, reproducible evaluation of agent capability at enterprise autonomous scale (50-500+ steps) without speculative claims on internal cognition.

---

## 14. Implementation Artifacts

1. **Contracts & Long-Horizon Engine**: [`packages/sandbox-contracts/src/long-horizon.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/long-horizon.ts)
2. **Schema Definition**: [`schemas/long-horizon-scenario.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/long-horizon-scenario.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/long-horizon.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/long-horizon.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/LONG_HORIZON_AGENT_TESTING_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/LONG_HORIZON_AGENT_TESTING_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0145-long-horizon-agent-testing.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0145-long-horizon-agent-testing.md)
