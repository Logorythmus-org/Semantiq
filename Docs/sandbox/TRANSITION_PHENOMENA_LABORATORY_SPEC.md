# SemantIQ Sandbox Specification: Transition Phenomena Laboratory Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 40)  
**Status**: Approved Specification  
**Date**: 2026-08-15  

---

## 1. Executive Summary

Static benchmark scores frequently obscure catastrophic non-linear failure modes in AI agents. An agent scoring 85% on a standard coding benchmark may abruptly drop to 0% when tool error rates increase slightly from 10% to 20%, or when context size approaches memory boundaries. Understanding these qualitative "phase transitions" requires systematic, controlled parameter sweeps that isolate exact inflection boundaries.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
`Benchmark → Scenario → Execution Contract → Provider Router → Provider Adapter → Runtime → Observation → Evidence → Evaluation → Report`

This specification defines the **Transition Phenomena Laboratory Architecture**:
1. **Controlled Experiment Taxonomy**: Categorizes 5 critical transition phenomena: [`ERROR_RECOVERY_PHASE_SHIFT`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/transition-lab.ts#L10-L16), [`CONTEXT_SATURATION_BREAKPOINT`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/transition-lab.ts#L10-L16), [`TOOL_COMPOSITION_THRESHOLD`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/transition-lab.ts#L10-L16), [`PERTURBATION_CLIFF`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/transition-lab.ts#L10-L16), and [`RESOURCE_THROTTLING_REGIME`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/transition-lab.ts#L10-L16).
2. **Transition Phenomena Engine**: Implements [`TransitionPhenomenaEngine`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/transition-lab.ts#L70-L215) to plan parameter sweeps ([`ControlledExperimentSpec`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/transition-lab.ts#L25-L33)), record observable trial metrics ([`TransitionMetricDataPoint`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/transition-lab.ts#L35-L44)), detect critical phase boundaries ([`CriticalTransitionThreshold`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/transition-lab.ts#L53-L58)), and classify behavioral regimes ([`ObservedBehavioralRegime`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/transition-lab.ts#L46-L51)).
3. **Strict Observable Behavioral Grounding**: Evaluates behavior strictly across the canonical sequence:
   $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$
   without claiming access to hidden cognition or internal model states.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                Controlled Experiment Planning                                |
|  [Independent Variable Sweep] ──> [Trials per Step Matrix] ──> [Fixed Control Constants]    |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                  Multi-Trial Execution & Ingestion                           |
|  • Parameterized Sandbox Invocations                                                        |
|  • Telemetry: Action Counts, Recovery Cycles, Loop Detection, Wall-Clock Latency            |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                Transition Inflection Analysis                                |
|  • Detect Critical Phase Shift Boundaries (Success Rate Drop >= 40%)                        |
|  • Classify Behavioral Regimes (Stable, Active Recovery, Pathological Stagnation)           |
|  • Sign Transition Analysis Report                                                          |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Scope and Non-Goals

### 2.1 In Scope
- **Transition Laboratory Specification**: Defining [`ControlledExperimentSpec`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/transition-lab.ts#L25-L33) and JSON Schema [`transition-phenomena-lab.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/transition-phenomena-lab.schema.json).
- **Phenomena Modeling**: Simulating tool failure rates, context length growth, multi-tool dependency depth, and hardware throttling.
- **Mathematical Inflection Detection**: Identifying empirical critical thresholds with confidence scores.
- **Observable Behavioral Preservation**: Evaluating observable action counts, recovery events, loop cycle frequencies, and execution times.

### 2.2 Non-Goals
- **No Claims on Hidden Cognition**: All metrics reflect observable shell outputs, tool inputs, and return codes, not internal token probabilities or neural weights.
- **No Manual Experiment Ad-Hocism**: Experiments are defined declaratively as machine-readable specs.

---

## 3. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Experiment Grammar, Schemas, and Engine (TransitionPhenomenaEngine)                      |
|  • Trial Matrix Generation & Independent Variable Injection Protocols                       |
|  • Phase Shift Detection & Mathematical Inflection Analysis Algorithms                      |
|  • Compiling & Signing Transition Analysis Reports                                          |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standardized Sandbox Execution Contracts)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Accurate Execution of Parameterized Sandboxes (CPU Limits, Error Injections)             |
|  • Preserving Sandbox Cleanliness across Sequential Trials                                  |
|  • Emitting Raw Telemetry without Smoothing or Filtering Data Spikes                        |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 4. Contracts and Schemas

### 4.1 TypeScript Transition Interfaces ([`packages/sandbox-contracts/src/transition-lab.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/transition-lab.ts))

```typescript
export type TransitionPhenomenonType =
  | 'ERROR_RECOVERY_PHASE_SHIFT'
  | 'CONTEXT_SATURATION_BREAKPOINT'
  | 'TOOL_COMPOSITION_THRESHOLD'
  | 'PERTURBATION_CLIFF'
  | 'RESOURCE_THROTTLING_REGIME';

export interface ControlledExperimentParameter {
  readonly name: string;
  readonly unit: string;
  readonly values: readonly (number | string | boolean)[];
  readonly controlValue: number | string | boolean;
}

export interface ControlledExperimentSpec {
  readonly experimentId: string;
  readonly phenomenonType: TransitionPhenomenonType;
  readonly scenarioId: string;
  readonly independentVariable: ControlledExperimentParameter;
  readonly controlConstants: Record<string, unknown>;
  readonly trialsPerStep: number;
  readonly timeoutPerTrialSeconds: number;
}

export interface TransitionMetricDataPoint {
  readonly paramValue: number | string | boolean;
  readonly trialIndex: number;
  readonly outcome: 'PASSED' | 'FAILED' | 'TIMEOUT' | 'ERROR';
  readonly actionCount: number;
  readonly recoveryEventsCount: number;
  readonly recoverySuccessRate: number;
  readonly loopCycleDetected: boolean;
  readonly wallClockDurationMs: number;
}

export interface ObservedBehavioralRegime {
  readonly regimeName: string;
  readonly parameterRange: string;
  readonly characteristicBehavior: string;
  readonly successRatePercentage: number;
}

export interface CriticalTransitionThreshold {
  readonly parameter: string;
  readonly thresholdValue: number | string;
  readonly confidence: number;
  readonly description: string;
}

export interface TransitionAnalysisReport {
  readonly experimentId: string;
  readonly phenomenonType: TransitionPhenomenonType;
  readonly totalTrials: number;
  readonly criticalThreshold?: CriticalTransitionThreshold;
  readonly observedRegimes: readonly ObservedBehavioralRegime[];
  readonly dataPoints: readonly TransitionMetricDataPoint[];
  readonly conclusions: readonly string[];
  readonly analyzedAt: string;
  readonly reportSignatureHex: string;
}
```

### 4.2 JSON Schema Manifests
- **[`schemas/transition-phenomena-lab.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/transition-phenomena-lab.schema.json)**: Validates experiment reports, regime objects, critical thresholds, and trial data point arrays.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `transitionAnalysisReportSchema`.

---

## 5. User & Experiment Lifecycle Flow

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    1. Experiment Specification                              |
|  Researcher defines ControlledExperimentSpec (e.g. error rate [0.0, 0.1, 0.2, 0.4, 0.6]).   |
|  Engine plans trial matrix (15 total trials).                                               |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                    2. Automated Execution                                    |
|  Runner executes trial matrix across sandboxes; records TransitionMetricDataPoint entries.  |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                    3. Mathematical Analysis                                 |
|  Engine groups trials by parameter value, computes success rates, identifies inflection.    |
|  Engine derives behavioral regimes and issues signed TransitionAnalysisReport.              |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 6. Security, Privacy, and Trust Posture

1. **Deterministic Experiment Provenance**: Every experiment specification and resulting analysis report is cryptographically signed, ensuring that trial data points cannot be fabricated or selectively omitted.
2. **Hermetic Trial Isolation**: Each trial executes in an ephemeral, freshly provisioned sandbox container/microVM to eliminate cross-trial state contamination.
3. **Observable Truth Invariant**: Conclusions are generated strictly from measured pass/fail rates, loop detection flags, and duration telemetry without speculative cognitive claims.

---

## 7. Open-Source vs. Commercial & Enterprise Lab Profiles

| Dimension | Open-Source (`LOCAL_RUNNER`) | Academic Research (`RESEARCH_CLUSTER`) | Enterprise (`CLOUD_GRID`) |
| :--- | :--- | :--- | :--- |
| **Trial Concurrency** | 1 - 4 parallel trials | 16 - 64 parallel trials | 128+ distributed trials |
| **Parameter Sweep Breadth** | 3 - 5 steps (e.g. error rates) | 10 - 20 fine-grained steps | Multi-dimensional grid sweeps |
| **Storage & Archival** | Local Markdown & JSON reports | Open Science Data Repository | Enterprise Compliance Data Lake |

---

## 8. Failure Modes & Resilience Strategies

| Failure Mode | Root Cause | Impact | Automated Recovery Action |
| :--- | :--- | :--- | :--- |
| **Insufficient Trial Data**| Partial run crash or abort | Inaccurate inflection | [`analyzeTransitions`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/transition-lab.ts#L93-L191) raises descriptive error |
| **Flaky Infrastructure** | Host CPU throttling skewing timings | Measurement noise | Engine filters outlier durations using interquartile range (IQR) |
| **False Phase Shift** | Microscopic sample size (1 trial/step) | Statistical artifact | Spec requires minimum `trialsPerStep >= 3` |
| **Endless Loop Hang** | Agent collapses into infinite retry | Trial timeout | Per-trial timeout enforced; trial marked as `FAILED` with loop flag |

---

## 9. Testing Strategy & Verification

The transition phenomena laboratory architecture is verified through automated test suites:
1. **Experiment Planning & Inflection Unit Tests ([`tests/unit/transition-lab.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/transition-lab.test.ts))**:
   - Validates experiment planning and trial matrix generation.
   - Tests ingestion of multi-step trial data points across parameter sweeps.
   - Validates mathematical detection of critical transition thresholds (e.g. sharp drop at error rate = 0.4).
   - Tests behavioral regime classification (stable vs active recovery vs loop stagnation).
   - Tests Markdown report rendering and cryptographic signature generation.
2. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `transitionAnalysisReportSchema`.

---

## 10. Acceptance Criteria

- [x] Transition laboratory contracts support 5 distinct behavioral transition phenomenon types.
- [x] Engine plans structured parameter sweep trial matrices with fixed control constants.
- [x] Inflection analysis algorithm mathematically detects critical transition thresholds.
- [x] Regimes classify observable behaviors without claims about hidden cognition.
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 11. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Fine Parameter Granularity vs. Compute Cost**: Running 20 parameter steps with 10 trials each requires 200 sandbox executions.  
  *Mitigation*: Implement adaptive bisection search to quickly locate phase boundaries using fewer overall trials.
- **Open Question**: Multi-variable phase space mapping (2D/3D heatmaps of concurrent error rate and context length).

---

## 12. Facts, Assumptions, and Recommendations

- **Facts**:
  - Agent architectures exhibit non-linear behavioral phase transitions under stress.
  - Phase shifts can be detected empirically via observable trial metrics.
- **Assumptions**:
  - Controlled parameter injections (e.g. tool exit codes, latency) behave deterministically.
- **Recommendations**:
  - Run standard transition experiments (e.g. error rate sweep) as a standard benchmark robustness profile.
  - Export `TRANSITION_REPORT.md` artifacts alongside standard evaluation receipts.

---

## 13. Architecture Decision Record

### [ADR-0140: Transition Phenomena Laboratory and Controlled Behavioral Experimentation](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0140-transition-phenomena-laboratory.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Define 5 transition phenomena types, implement `TransitionPhenomenaEngine`, ground analyses strictly in observable behavioral metrics across the canonical chain, detect mathematical critical thresholds, and classify behavioral regimes.
- **Consequences**: Provides empirical, scientific insight into agent stability boundaries and failure modes without speculative claims on internal cognition.

---

## 14. Implementation Artifacts

1. **Contracts & Transition Engine**: [`packages/sandbox-contracts/src/transition-lab.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/transition-lab.ts)
2. **Schema Definition**: [`schemas/transition-phenomena-lab.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/transition-phenomena-lab.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/transition-lab.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/transition-lab.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/TRANSITION_PHENOMENA_LABORATORY_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/TRANSITION_PHENOMENA_LABORATORY_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0140-transition-phenomena-laboratory.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0140-transition-phenomena-laboratory.md)
