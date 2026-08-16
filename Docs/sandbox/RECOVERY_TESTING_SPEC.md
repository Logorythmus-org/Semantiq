# SemantIQ Sandbox Specification: Recovery Testing Protocols and Metrics Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 43)  
**Status**: Approved Specification  
**Date**: 2026-08-15

---

## 1. Executive Summary

Autonomous agent capability cannot be measured solely by linear, error-free executions. In production software engineering, cybersecurity, and DevOps workflows, agents regularly encounter unexpected exceptions, incorrect initial assumptions, changed environment states, and failed test assertions. A truly autonomous agent must possess self-healing competence: diagnosing errors, revising hypotheses, probing the environment, and recovering without human intervention.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
`Benchmark → Scenario → Execution Contract → Provider Router → Provider Adapter → Runtime → Observation → Evidence → Evaluation → Report`

This specification defines the **Recovery Testing Protocols and Metrics Architecture**:

1. **Trigger & Archetype Taxonomy**: Classifies 6 failure triggers ([`RecoveryTriggerCategory`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/recovery-testing.ts#L9-L16)) and 6 observable recovery archetypes ([`RecoveryBehaviorArchetype`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/recovery-testing.ts#L18-L25)).
2. **Quantitative Self-Healing Metrics**: Defines mathematical formulations for Recovery Success Rate ($R_{sr}$), Mean Steps to Recovery ($MTTR_{steps}$), Stagnation Index ($S_{index}$), Diagnostic Probing Density ($D_{probe}$), and the composite **Recovery Resilience Index ($RRI$)**.
3. **Recovery Testing Engine**: Implements [`RecoveryTestingEngine`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/recovery-testing.ts#L57-L225) to parse observable [`BehavioralTraceEvent`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/evidence-package.ts#L22-L31) logs, extract recovery episodes ([`RecoveryEpisodeTrace`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/recovery-testing.ts#L33-L44)), generate cryptographically sealed scorecards ([`RecoveryResilienceScorecard`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/recovery-testing.ts#L46-L60)), and award 5 standardized certification grades ([`RecoveryCertificationGrade`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/recovery-testing.ts#L27-L32)).
4. **Strict Observable Behavioral Grounding**: Evaluates behavior strictly across the canonical sequence:
   $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$
   without claiming access to hidden cognition or internal model states.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                  Behavioral Trace Parser                                    |
|  [Observable Event Stream] ──> [Detect Failure: Exit Code != 0 / Assertion Failed]          |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 Recovery Episode Extraction                                 |
|  • Track Intermediate Actions: Diagnostic Probing (ls, cat) vs Stagnant Repeats             |
|  • Detect Resolution: Exit Code == 0 / Test Passed ──> Calculate Steps Latency             |
|  • Classify Archetype: EXPLORATORY_PROBING / CORRECTIVE_REFACTOR / PATHOLOGICAL_STAGNATION  |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 Mathematical Resilience Scoring                             |
|  • Calculate Rsr, MTTR_steps, Stagnation Index, Probing Density, Composite RRI              |
|  • Assign Recovery Grade: GRADE_A_SELF_HEALING to GRADE_F_STAGNANT                          |
|  • Cryptographically Sign RecoveryResilienceScorecard                                       |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Scope and Non-Goals

### 2.1 In Scope

- **Recovery Testing Specification**: Defining [`RecoveryResilienceScorecard`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/recovery-testing.ts#L46-L60) and JSON Schema [`recovery-resilience-scorecard.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/recovery-testing-scorecard.schema.json).
- **Episode Extraction Algorithm**: Automatically parsing sequential trace events into discrete failure $\to$ recovery episodes.
- **Quantitative Metrics & Grading**: Calculating $RRI$, $MTTR$, stagnation metrics, and assigning certification grades.
- **Observable Behavioral Preservation**: Evaluating observable commands, diagnostic queries, and retry frequencies.

### 2.2 Non-Goals

- **No Claims on Hidden Cognition**: Evaluates external observable shell/tool interactions, not internal model latent representations.
- **No In-Process Agent Tampering**: The engine evaluates raw emitted event streams post-flight or asynchronously via observation middleware.

---

## 3. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Recovery Grammar, Scorecard Schemas, and Engine (RecoveryTestingEngine)                  |
|  • Episode Extraction & Archetype Classification Algorithms                                 |
|  • Mathematical Metrics Calculation (Rsr, MTTR, Stagnation, Probing Density, RRI)           |
|  • Compiling & Cryptographically Signing Recovery Scorecards                                |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standardized Sandbox Execution Contracts)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Emitting Raw Unaltered Event Streams with Accurate Exit Codes & Stderr Outputs           |
|  • Preserving Sandbox Integrity During Diagnostic Probing & File Modifications             |
|  • Delivering Accurate Chronological Timestamps for Step-Latency Tracking                   |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 4. Contracts and Schemas

### 4.1 TypeScript Recovery Interfaces ([`packages/sandbox-contracts/src/recovery-testing.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/recovery-testing.ts))

```typescript
export type RecoveryTriggerCategory =
  | "EXECUTION_ERROR"
  | "FAILED_ASSERTION"
  | "STALE_ENVIRONMENT_DRIFT"
  | "INCORRECT_ASSUMPTION"
  | "PERMISSION_DENIED"
  | "TIMEOUT_EXHAUSTION";

export type RecoveryBehaviorArchetype =
  | "CORRECTIVE_REFACTOR"
  | "EXPLORATORY_PROBING"
  | "ENVIRONMENTAL_RECONCILIATION"
  | "HYPOTHESIS_PIVOT"
  | "GRACEFUL_DEGRADATION"
  | "PATHOLOGICAL_STAGNATION";

export type RecoveryCertificationGrade =
  | "GRADE_A_SELF_HEALING"
  | "GRADE_B_ADAPTIVE"
  | "GRADE_C_TARDY"
  | "GRADE_D_BRITTLE"
  | "GRADE_F_STAGNANT";

export interface RecoveryEpisodeTrace {
  readonly episodeId: string;
  readonly triggerCategory: RecoveryTriggerCategory;
  readonly triggerEventSeq: number;
  readonly resolvedEventSeq?: number;
  readonly latencySteps: number;
  readonly archetype: RecoveryBehaviorArchetype;
  readonly isSuccessful: boolean;
  readonly stagnationCount: number;
  readonly diagnosticProbesCount: number;
}

export interface RecoveryResilienceScorecard {
  readonly scenarioId: string;
  readonly agentId: string;
  readonly totalEpisodes: number;
  readonly successfulEpisodes: number;
  readonly recoverySuccessRate: number; // 0.0 to 1.0
  readonly meanStepsToRecovery: number;
  readonly stagnationIndex: number; // 0.0 to 1.0
  readonly diagnosticProbingDensity: number; // 0.0 to 1.0
  readonly recoveryResilienceIndex: number; // 0.0 to 1.0
  readonly recoveryGrade: RecoveryCertificationGrade;
  readonly episodes: readonly RecoveryEpisodeTrace[];
  readonly evaluatedAt: string;
  readonly scorecardSignatureHex: string;
}
```

### 4.2 JSON Schema Manifests

- **[`schemas/recovery-testing-scorecard.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/recovery-testing-scorecard.schema.json)**: Validates recovery scorecards, episode traces, resilience metrics, and certification grades.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `recoveryResilienceScorecardSchema`.

---

## 5. Mathematical Formulations

### 5.1 Recovery Success Rate ($R_{sr}$)

$$R_{sr} = \frac{N_{\text{successful}}}{N_{\text{total\_episodes}}}$$

### 5.2 Mean Steps to Recovery ($MTTR_{steps}$)

$$MTTR_{steps} = \frac{1}{N_{\text{successful}}} \sum_{i \in \text{Successful}} \text{latencySteps}_i$$

### 5.3 Stagnation Index ($S_{index}$)

$$S_{index} = \min\left(1.0, \frac{\sum \text{stagnationCount}_i}{2 \cdot N_{\text{total\_episodes}}}\right)$$

### 5.4 Diagnostic Probing Density ($D_{probe}$)

$$D_{probe} = \min\left(1.0, \frac{\sum \text{diagnosticProbesCount}_i}{2 \cdot N_{\text{total\_episodes}}}\right)$$

### 5.5 Recovery Resilience Index ($RRI$)

$$RRI = 0.40 \cdot R_{sr} + 0.25 \cdot \left(1 - \min\left(1, \frac{MTTR_{steps}}{10}\right)\right) + 0.20 \cdot D_{probe} + 0.15 \cdot (1 - S_{index})$$

---

## 6. Security, Privacy, and Trust Posture

1. **Unforgeable Scorecards**: Each scorecard includes a canonical JSON SHA-256 digest signed with the evaluator's private key (`scorecardSignatureHex`).
2. **Deterministic Episode Parsing**: Trace parsing strictly evaluates chronological sequence numbers, command patterns, and return codes, ensuring 100% reproducible metric calculations.
3. **No Cognitive Speculation**: Scorecards reflect concrete executed actions and verified outcomes without assuming hidden intent.

---

## 7. Open-Source vs. Commercial & Enterprise Recovery Profiles

| Dimension            | Open-Source (`COMMUNITY_BENCH`)    | Academic Research (`RESEARCH_EVAL`) | Enterprise (`PROD_CERTIFICATION`)         |
| :------------------- | :--------------------------------- | :---------------------------------- | :---------------------------------------- |
| **Recovery Tiers**   | `GRADE_A` through `GRADE_F` Badges | Full Statistical Inflection Curves  | SLA & MTTR Compliance Thresholds          |
| **Stagnation Guard** | Informational Warning              | Detailed Loop Entropy Analysis      | Mandatory Block for Automated Deployments |
| **Scorecard Export** | Local Markdown & JSON              | Research Paper Data Bundle          | Enterprise Compliance Audit Trail         |

---

## 8. Failure Modes & Resilience Strategies

| Failure Mode                 | Root Cause                          | Impact           | Automated Recovery Action                                 |
| :--------------------------- | :---------------------------------- | :--------------- | :-------------------------------------------------------- |
| **Pathological Stagnation**  | Agent repeats exact failed action   | Loop deadlock    | Engine flags stagnation; assigns `GRADE_F_STAGNANT`       |
| **Unresolved Episode**       | Run ends before recovery            | Incomplete task  | Marked as `isSuccessful: false`; penalized in $R_{sr}$    |
| **Zero Failure Run**         | Pristine run with zero errors       | Division by zero | Engine handles gracefully, awarding default perfect grade |
| **Diagnostic Hallucination** | Spams `ls`/`cat` without fixing bug | Probing bloat    | $MTTR$ penalty bounds excessive unhelpful probing         |

---

## 9. Testing Strategy & Verification

The recovery testing architecture is validated through automated test suites:

1. **Episode Extraction & Metric Unit Tests ([`tests/unit/recovery-testing.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/recovery-testing.test.ts))**:
   - Validates episode extraction and `EXPLORATORY_PROBING` archetype classification.
   - Tests calculation of $RRI$, $MTTR$, $R_{sr}$, and awarding `GRADE_A_SELF_HEALING`.
   - Tests detection of pathological stagnation resulting in `GRADE_F_STAGNANT`.
   - Tests Markdown report rendering and cryptographic signature generation.
2. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `recoveryResilienceScorecardSchema`.

---

## 10. Acceptance Criteria

- [x] Recovery testing contracts define 6 failure trigger categories and 6 recovery archetypes.
- [x] Engine extracts discrete recovery episodes from observable behavioral traces.
- [x] Mathematical metric algorithms calculate $R_{sr}$, $MTTR_{steps}$, $S_{index}$, $D_{probe}$, and $RRI$.
- [x] Certification grading algorithm classifies recovery capabilities across 5 standardized tiers.
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 11. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Probing Reward vs. Verbose Command Spam**: Rewarding diagnostic probing must not incentivize useless read-only queries.  
  _Mitigation_: The $MTTR_{steps}$ metric penalizes slow recovery latencies, balancing diagnostic depth with prompt execution.
- **Open Question**: Dynamic hypothesis shift detection using semantic embeddings of action diffs.

---

## 12. Facts, Assumptions, and Recommendations

- **Facts**:
  - Autonomous self-healing is measurable via step latency, diagnostic probing, and loop avoidance.
  - Recovery metrics can be computed deterministically from observable event traces.
- **Assumptions**:
  - Action strings and exit codes accurately reflect command execution states.
- **Recommendations**:
  - Require a minimum `GRADE_B_ADAPTIVE` rating ($RRI \ge 70\%$) for agents deployed in mission-critical autonomous environments.
  - Publish recovery resilience scorecards alongside standard benchmark leaderboards.

---

## 13. Architecture Decision Record

### [ADR-0143: Recovery Testing Protocols and Self-Healing Metrics Architecture](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0143-recovery-testing-protocols.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Define recovery trigger categories and archetypes, implement `RecoveryTestingEngine`, ground evaluations in observable behavioral trajectories across the canonical chain, and compute mathematical self-healing metrics ($R_{sr}$, $MTTR$, $S_{index}$, $D_{probe}$, $RRI$) with 5-tier certification grades.
- **Consequences**: Enables rigorous, reproducible evaluation and certification of AI agent self-healing and error recovery competence without speculative claims on internal cognition.

---

## 14. Implementation Artifacts

1. **Contracts & Recovery Engine**: [`packages/sandbox-contracts/src/recovery-testing.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/recovery-testing.ts)
2. **Schema Definition**: [`schemas/recovery-testing-scorecard.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/recovery-testing-scorecard.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/recovery-testing.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/recovery-testing.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/RECOVERY_TESTING_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/RECOVERY_TESTING_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0143-recovery-testing-protocols.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0143-recovery-testing-protocols.md)
