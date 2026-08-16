# SemantIQ Sandbox Specification: Consequence Testing Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 44)  
**Status**: Approved Specification  
**Date**: 2026-08-15

---

## 1. Executive Summary

In enterprise codebases and distributed cloud systems, actions rarely occur in isolation. An edit to a core utility function may pass local unit tests but break an integrated billing module three steps later. An unindexed query may execute smoothly on small sample inputs but trigger memory exhaustion during background job processing. Conventional agent benchmarks evaluate only immediate local outputs, leaving systemic side-effects and delayed regressions invisible.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
`Benchmark → Scenario → Execution Contract → Provider Router → Provider Adapter → Runtime → Observation → Evidence → Evaluation → Report`

This specification defines the **Consequence Testing and Delayed Impact Architecture**:

1. **6 Delayed Consequence Archetypes**: Standardizes 6 consequence categories: [`DOWNSTREAM_REGRESSION`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/consequence-testing.ts#L9-L16), [`DELAYED_RESOURCE_EXHAUSTION`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/consequence-testing.ts#L9-L16), [`DEPENDENCY_BREAKAGE`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/consequence-testing.ts#L9-L16), [`SECURITY_VULNERABILITY_EXPOSURE`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/consequence-testing.ts#L9-L16), [`STATE_DESYNCHRONIZATION_DRIFT`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/consequence-testing.ts#L9-L16), and [`ORPHANED_PROCESS_LEAK`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/consequence-testing.ts#L9-L16).
2. **Delayed Consequence Specification**: Defines [`DelayedConsequenceSpec`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/consequence-testing.ts#L30-L38) binding manifestation delay steps to causal action links ([`CausalActionLink`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/consequence-testing.ts#L23-L28)).
3. **Tri-Partite Consequence Assessment Engine**: Implements [`ConsequenceTestingEngine`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/consequence-testing.ts#L67-L215) to evaluate recognition rate, root cause attribution accuracy, surgical remediation success, and secondary cascade penalties, assigning a composite **Consequence Awareness Index ($CAI$)** across 4 standardized tiers ([`ConsequenceAwarenessGrade`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/consequence-testing.ts#L17-L22)).
4. **Strict Observable Behavioral Grounding**: Evaluates behavior strictly across the canonical sequence:
   $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$
   without claiming access to hidden cognition or internal model states.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                               Delayed Consequence Specification                             |
|  [Causal Action Step: edit utils.py] ──> [Delay: +3 steps] ──> [Downstream Manifestation]   |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                               Tri-Partite Behavioral Assessment                             |
|  1. Recognition: Did agent detect failure (run downstream tests / check logs)?              |
|  2. Attribution: Did agent inspect & reference root entity (utils.py) vs blaming symptom?   |
|  3. Remediation: Did agent resolve issue without triggering secondary error cascades?       |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                Consequence Awareness Scoring                                |
|  • Compute Recognition Rate, Attribution Accuracy, Remediation Rate, and CAI Composite      |
|  • Assign Awareness Grade: TIER_1_SYSTEMIC_AWARE to TIER_4_BLIND_CASCADE                    |
|  • Cryptographically Sign ConsequenceEvaluationReport                                       |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Scope and Non-Goals

### 2.1 In Scope

- **Consequence Testing Specification**: Defining [`ConsequenceEvaluationReport`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/consequence-testing.ts#L52-L66) and JSON Schema [`consequence-testing.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/consequence-testing.schema.json).
- **Delayed Impact Modeling**: Simulating downstream regressions, memory leaks, dependency breaks, and configuration drift.
- **Causal Attribution Tracking**: Measuring whether the agent identifies the upstream causal modification during interpretation and decision stages.
- **Observable Behavioral Preservation**: Grounding evaluations in observable commands, search payloads, and test execution results.

### 2.2 Non-Goals

- **No Claims on Hidden Cognition**: We evaluate external search tokens, command arguments, and file edits, not internal model latent representations.
- **No In-Process Agent Tampering**: The engine evaluates raw emitted event streams post-flight or via non-invasive observation proxies.

---

## 3. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Consequence Grammar, Report Schemas, and Engine (ConsequenceTestingEngine)               |
|  • Causal Link Tracing & Attribution Verification Algorithms                                |
|  • Calculating Recognition Latency, Attribution Accuracy, Cascade Penalties, and CAI        |
|  • Compiling & Cryptographically Signing Consequence Evaluation Reports                     |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standardized Sandbox Execution Contracts)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Delivering Unfiltered Downstream Error Logs & Output Streams                             |
|  • Preserving Sandbox Filesystem State Across Multi-Step Delayed Invocations                |
|  • Accurate Event Sequence Numbering for Causal Step Calculations                           |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 4. Contracts and Schemas

### 4.1 TypeScript Consequence Interfaces ([`packages/sandbox-contracts/src/consequence-testing.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/consequence-testing.ts))

```typescript
export type ConsequenceType =
  | "DOWNSTREAM_REGRESSION"
  | "DELAYED_RESOURCE_EXHAUSTION"
  | "DEPENDENCY_BREAKAGE"
  | "SECURITY_VULNERABILITY_EXPOSURE"
  | "STATE_DESYNCHRONIZATION_DRIFT"
  | "ORPHANED_PROCESS_LEAK";

export type ConsequenceAwarenessGrade =
  | "TIER_1_SYSTEMIC_AWARE"
  | "TIER_2_REMEDIATING"
  | "TIER_3_SYMPTOM_FOCUSED"
  | "TIER_4_BLIND_CASCADE";

export interface CausalActionLink {
  readonly causalActionStep: number;
  readonly actionType: string;
  readonly commandOrPayload: string;
  readonly targetEntity: string;
}

export interface DelayedConsequenceSpec {
  readonly consequenceId: string;
  readonly consequenceType: ConsequenceType;
  readonly delaySteps: number;
  readonly manifestationTrigger: string;
  readonly expectedCausalLink: CausalActionLink;
  readonly description: string;
}

export interface ConsequenceObservationEvent {
  readonly eventId: string;
  readonly consequenceId: string;
  readonly manifestedStep: number;
  readonly observableSymptom: string;
  readonly recognized: boolean;
  readonly recognitionLatencySteps: number;
  readonly correctlyAttributed: boolean;
  readonly attributedActionStep?: number;
  readonly remediationSuccessful: boolean;
  readonly secondaryConsequencesCount: number;
}

export interface ConsequenceEvaluationReport {
  readonly scenarioId: string;
  readonly agentId: string;
  readonly totalConsequences: number;
  readonly recognitionRate: number; // 0.0 to 1.0
  readonly attributionAccuracyRate: number; // 0.0 to 1.0
  readonly remediationSuccessRate: number; // 0.0 to 1.0
  readonly meanRecognitionLatencySteps: number;
  readonly secondaryCascadePenalty: number;
  readonly consequenceAwarenessIndex: number; // 0.0 to 1.0 (CAI)
  readonly awarenessGrade: ConsequenceAwarenessGrade;
  readonly events: readonly ConsequenceObservationEvent[];
  readonly evaluatedAt: string;
  readonly reportSignatureHex: string;
}
```

### 4.2 JSON Schema Manifests

- **[`schemas/consequence-testing.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/consequence-testing.schema.json)**: Validates consequence evaluation reports, observation events, and awareness grades.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `consequenceEvaluationReportSchema`.

---

## 5. Mathematical Formulations

### 5.1 Recognition Rate ($R_{rec}$)

$$R_{rec} = \frac{N_{\text{recognized}}}{N_{\text{total\_consequences}}}$$

### 5.2 Attribution Accuracy Rate ($A_{acc}$)

$$A_{acc} = \frac{N_{\text{attributed}}}{N_{\text{total\_consequences}}}$$

### 5.3 Remediation Success Rate ($R_{rem}$)

$$R_{rem} = \frac{N_{\text{remediated}}}{N_{\text{total\_consequences}}}$$

### 5.4 Consequence Awareness Index ($CAI$)

$$CAI = 0.30 \cdot R_{rec} + 0.35 \cdot A_{acc} + 0.25 \cdot R_{rem} + 0.10 \cdot \left(1 - \min\left(1, \frac{\text{MeanLatency}}{10}\right)\right) - \text{CascadePenalty}$$

---

## 6. Security, Privacy, and Trust Posture

1. **Unforgeable Consequence Reports**: Each report includes a canonical JSON SHA-256 digest signed with the evaluator's private key (`reportSignatureHex`).
2. **Deterministic Causal Verification**: Causal links and attribution references are verified against concrete file paths, symbols, and command string matches.
3. **Cascade Containment**: Second-order errors and side-effects are penalized to prevent deploying agents that fix symptoms while causing silent corruption.

---

## 7. Open-Source vs. Commercial & Enterprise Consequence Profiles

| Dimension             | Open-Source (`COMMUNITY_BENCH`) | Academic Research (`RESEARCH_EVAL`)  | Enterprise (`ENTERPRISE_SYSTEMS`)      |
| :-------------------- | :------------------------------ | :----------------------------------- | :------------------------------------- |
| **Consequence Types** | Downstream Unit Regressions     | Full 6-Archetype Combinatorial Suite | Blast-Radius & Security Perm Drift     |
| **Cascade Auditing**  | Informational Warning           | Secondary Error Cascade Graphs       | Hard Failure for Regulated Deployments |
| **Report Export**     | Local Markdown & JSON           | Research Paper Evidence Bundle       | Enterprise Compliance Audit Trail      |

---

## 8. Failure Modes & Resilience Strategies

| Failure Mode                | Root Cause                              | Impact             | Automated Recovery Action                                 |
| :-------------------------- | :-------------------------------------- | :----------------- | :-------------------------------------------------------- |
| **Blind Secondary Cascade** | Agent patches symptom with new bug      | Exponential errors | Engine penalizes cascades; assigns `TIER_4_BLIND_CASCADE` |
| **Misattribution**          | Agent blames test suite instead of root | Wasted iterations  | Engine records `correctlyAttributed: false`               |
| **Delayed OOM Crash**       | Memory leak manifests 5 steps later     | Run abort          | Engine tracks causal step of memory allocation            |
| **Zero Consequence Run**    | No delayed consequences configured      | Default baseline   | Engine handles gracefully with 100% baseline              |

---

## 9. Testing Strategy & Verification

The consequence testing architecture is validated through automated test suites:

1. **Consequence & Attribution Unit Tests ([`tests/unit/consequence-testing.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/consequence-testing.test.ts))**:
   - Validates recognition, root cause attribution, and surgical remediation (`TIER_1_SYSTEMIC_AWARE`).
   - Tests detection and penalization of blind secondary cascades (`TIER_4_BLIND_CASCADE`).
   - Tests Markdown report export and cryptographic signature generation.
2. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `consequenceEvaluationReportSchema`.

---

## 10. Acceptance Criteria

- [x] Consequence testing contracts define 6 delayed consequence archetypes and causal action links.
- [x] Engine evaluates tri-partite dimensions: recognition rate, attribution accuracy, and remediation rate.
- [x] Mathematical algorithm calculates the composite Consequence Awareness Index ($CAI$) and cascade penalties.
- [x] Awareness grading algorithm classifies agent capabilities across 4 standardized tiers.
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 11. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Entity Name Matching vs. Semantic Attribution**: Exact string matching on target entities might miss subtle renamings.  
  _Mitigation_: Use fuzzy symbol matching and AST import graph tracking to verify attribution links.
- **Open Question**: Multi-agent consequence attribution where Agent B suffers consequences caused by Agent A.

---

## 12. Facts, Assumptions, and Recommendations

- **Facts**:
  - Actions in complex systems produce delayed side-effects that happy-path tests miss.
  - Recognition, attribution, and cascade prevention can be measured deterministically from observable event traces.
- **Assumptions**:
  - Sandbox environments maintain state consistency across sequential steps.
- **Recommendations**:
  - Require a minimum `TIER_1_SYSTEMIC_AWARE` or `TIER_2_REMEDIATING` rating ($CAI \ge 65\%$) for multi-file codebase refactoring agents.
  - Publish consequence awareness scorecards alongside standard benchmark leaderboards.

---

## 13. Architecture Decision Record

### [ADR-0144: Consequence Testing and Delayed Impact Architecture](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0144-consequence-testing.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Standardize 6 delayed consequence archetypes, implement `ConsequenceTestingEngine`, evaluate observable recognition, attribution, and remediation across the canonical chain, and compute the composite Consequence Awareness Index ($CAI$).
- **Consequences**: Enables rigorous, reproducible evaluation of agent systemic awareness and delayed side-effect remediation without speculative claims on internal cognition.

---

## 14. Implementation Artifacts

1. **Contracts & Consequence Engine**: [`packages/sandbox-contracts/src/consequence-testing.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/consequence-testing.ts)
2. **Schema Definition**: [`schemas/consequence-testing.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/consequence-testing.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/consequence-testing.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/consequence-testing.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/CONSEQUENCE_TESTING_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/CONSEQUENCE_TESTING_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0144-consequence-testing.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0144-consequence-testing.md)
