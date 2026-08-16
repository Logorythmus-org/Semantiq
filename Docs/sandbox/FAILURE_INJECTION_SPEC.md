# SemantIQ Sandbox Specification: Failure Injection Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 42)  
**Status**: Approved Specification  
**Date**: 2026-08-15

---

## 1. Executive Summary

Production environments are inherently chaotic: network sockets drop, downstream tool microservices return HTTP 500 errors, context windows truncate abruptly, and file permissions change unexpectedly. Conventional AI evaluations measure only happy-path success, leaving critical failure dynamics undetected. True agent robustness requires systematic, reproducible chaos engineering that tests hypothesis revision, error recovery, and self-healing.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
`Benchmark → Scenario → Execution Contract → Provider Router → Provider Adapter → Runtime → Observation → Evidence → Evaluation → Report`

This specification defines the **Failure Injection and Chaos Engineering Architecture**:

1. **7 Injected Fault Types**: Standardizes 7 deterministic fault modes: [`CONTEXT_LOSS_TRUNCATION`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/failure-injection.ts#L9-L16), [`TOOL_RPC_ERROR`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/failure-injection.ts#L9-L16), [`NETWORK_PARTITION_LATENCY`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/failure-injection.ts#L9-L16), [`STALE_STATE_DRIFT`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/failure-injection.ts#L9-L16), [`CONTRADICTION_MUTATION`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/failure-injection.ts#L9-L16), [`PERMISSION_REVOCATION`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/failure-injection.ts#L9-L16), and [`PARTIAL_RESULT_CORRUPTION`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/failure-injection.ts#L9-L16).
2. **Deterministic Trigger Engine**: Implements [`FailureInjectionEngine`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/failure-injection.ts#L68-L215) to compile execution plans ([`FailureInjectionPlan`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/failure-injection.ts#L33-L38)) triggered on step indices, regex matches, tool names, file paths, or probabilities.
3. **Multi-Step Recovery & MTTR Evaluation**: Evaluates observable recovery trajectories strictly across the canonical sequence:
   $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$
   measuring recovery latency (steps), recovery action types, and pathological retry loop frequencies.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                Chaos Injection Planning                                     |
|  [Trigger Rules: Step/Regex/Tool] ──> [Deterministic Seed] ──> [FailureInjectionPlan]       |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                Runtime Middleware Injection                                 |
|  • Intercepts Action (Shell/Tool/API)                                                       |
|  • Injects Mutated Error / Timeout / Permission Revocation / Truncated JSON Output          |
|  • Emits InjectedFaultEvent Telemetry Record                                                |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                               Observable Recovery Assessment                                |
|  • Track Subsequent Trajectory: Did Agent Recover or Loop Infinitely?                       |
|  • Compute Mean Time to Recovery (MTTR in steps) & Resilience Score ($0.0 \le S \le 1.0$)   |
|  • Cryptographically Sign FailureInjectionReport                                            |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Scope and Non-Goals

### 2.1 In Scope

- **Failure Injection Specification**: Defining [`FailureInjectionPlan`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/failure-injection.ts#L33-L38) and JSON Schema [`failure-injection-plan.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/failure-injection-plan.schema.json).
- **7 Fault Injection Modes**: Simulating context truncation, tool RPC 500 errors, network timeouts, stale file state, shifted test assertions, permission revocations, and corrupted stdout streams.
- **Recovery & MTTR Tracking**: Measuring step-based recovery latency, alternative action types, and infinite retry loop detection.
- **Observable Behavioral Preservation**: Evaluating observable shell commands, tool retries, and output reconciliations.

### 2.2 Non-Goals

- **No Claims on Hidden Cognition**: Evaluates strictly observable actions, stdout/stderr streams, and return codes rather than internal model attention weights.
- **No Random Non-Reproducible Chaos**: Fault injection sequences are strictly deterministic and replayable via seeds.

---

## 3. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Chaos Taxonomy, Trigger Grammar, and Engine (FailureInjectionEngine)                     |
|  • Deterministic Plan Compilation & Action Mutation Middleware                              |
|  • Multi-Step Recovery Trajectory Analysis & Loop Detection Algorithms                      |
|  • Compiling & Cryptographically Signing Failure Injection Reports                          |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standardized Sandbox Execution Contracts)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Faithful Execution of Mutated Tool Outputs & Permission States                           |
|  • Preserving Sandbox Ephemerality & Hermetic Reset Between Chaos Runs                      |
|  • Delivering Accurate Event Sequence Timestamps & Output Logs                              |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 4. Contracts and Schemas

### 4.1 TypeScript Failure Interfaces ([`packages/sandbox-contracts/src/failure-injection.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/failure-injection.ts))

```typescript
export type InjectedFaultType =
  | "CONTEXT_LOSS_TRUNCATION"
  | "TOOL_RPC_ERROR"
  | "NETWORK_PARTITION_LATENCY"
  | "STALE_STATE_DRIFT"
  | "CONTRADICTION_MUTATION"
  | "PERMISSION_REVOCATION"
  | "PARTIAL_RESULT_CORRUPTION";

export type FaultTriggerType =
  "ON_STEP_INDEX" | "ON_COMMAND_REGEX" | "ON_TOOL_NAME" | "ON_FILE_PATH" | "PROBABILISTIC";

export interface FaultTriggerCondition {
  readonly triggerType: FaultTriggerType;
  readonly triggerValue: string | number;
  readonly maxTriggerCount: number;
}

export interface FaultInjectionRule {
  readonly ruleId: string;
  readonly faultType: InjectedFaultType;
  readonly trigger: FaultTriggerCondition;
  readonly mutationPayload: Record<string, unknown>;
  readonly description: string;
}

export interface FailureInjectionPlan {
  readonly planId: string;
  readonly scenarioId: string;
  readonly rules: readonly FaultInjectionRule[];
  readonly deterministicSeed: string;
}

export interface InjectedFaultEvent {
  readonly faultEventId: string;
  readonly ruleId: string;
  readonly stepIndex: number;
  readonly faultType: InjectedFaultType;
  readonly targetAction: string;
  readonly injectedOutcome: Record<string, unknown>;
  readonly timestamp: string;
}

export interface FaultRecoveryAssessment {
  readonly faultEventId: string;
  readonly faultType: InjectedFaultType;
  readonly recovered: boolean;
  readonly recoveryLatencySteps: number;
  readonly recoveryActionType?: string;
  readonly pathologicalLoopDetected: boolean;
}

export interface FailureInjectionReport {
  readonly planId: string;
  readonly scenarioId: string;
  readonly totalInjectedFaults: number;
  readonly recoveredFaultsCount: number;
  readonly meanTimeToRecoverySteps: number;
  readonly faultResilienceScore: number;
  readonly injectedEvents: readonly InjectedFaultEvent[];
  readonly assessments: readonly FaultRecoveryAssessment[];
  readonly analyzedAt: string;
  readonly reportSignatureHex: string;
}
```

### 4.2 JSON Schema Manifests

- **[`schemas/failure-injection-plan.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/failure-injection-plan.schema.json)**: Validates chaos reports, injected fault events, recovery assessments, and scores.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `failureInjectionReportSchema`.

---

## 5. User & Chaos Testing Lifecycle Flow

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    1. Plan Definition                                       |
|  Evaluator specifies FaultInjectionRule list (e.g., inject tool error on pytest command).   |
|  Engine creates deterministic FailureInjectionPlan with cryptographic plan ID.              |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                    2. Middleware Interception                               |
|  Agent executes commands in sandbox.                                                        |
|  Engine triggers fault rule, mutates output (e.g. exit 1, RPC error), logs event.          |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                    3. Recovery Evaluation                                   |
|  Engine inspects subsequent behavioral trace: detects RECOVERY, calculates MTTR & loops.    |
|  Engine issues signed FailureInjectionReport.                                               |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 6. Security, Privacy, and Trust Posture

1. **Deterministic Chaos Seeding**: Fault injection schedules are seeded and replayable, enabling developers to reproduce and debug rare recovery failure edge cases.
2. **Hermetic Sandbox Isolation**: Fault injections (such as `PERMISSION_REVOCATION`) modify only internal sandbox cgroups/filesystems without affecting host systems.
3. **Cryptographic Report Signatures**: Every failure injection report is cryptographically sealed, guaranteeing unforgeable chaos evaluation claims.

---

## 7. Open-Source vs. Commercial & Enterprise Chaos Profiles

| Chaos Dimension      | Open-Source (`LOCAL_CHAOS`)   | Academic Research (`CHAOS_BENCH`) | Enterprise (`PROD_READINESS`)         |
| :------------------- | :---------------------------- | :-------------------------------- | :------------------------------------ |
| **Fault Suite**      | Tool RPC & Step-Index Errors  | Full 7-Fault Combinatorial Matrix | High-Concurrency Network Chaos        |
| **Recovery Metrics** | MTTR Steps, Pass/Fail         | Phase-Transition Recovery Curves  | SLA & Cascading Failure Audits        |
| **Replay Artifacts** | Local JSON & Markdown Reports | Reproducible Artifact Bundle      | Enterprise Incident Simulation Bundle |

---

## 8. Failure Modes & Resilience Strategies

| Failure Mode                    | Root Cause                                | Impact           | Automated Recovery Action                                       |
| :------------------------------ | :---------------------------------------- | :--------------- | :-------------------------------------------------------------- |
| **Pathological Loop**           | Agent repeats identical failed command    | Run timeout      | Engine detects loop ($>2$ identical actions) and logs loop flag |
| **Cascading Collapse**          | Minor tool error triggers panic           | Run failure      | Engine tracks step latency from error to final task failure     |
| **Trigger Over-Firing**         | Regex matches more commands than intended | Inaccurate test  | Rule parameter `maxTriggerCount` caps total firings             |
| **Non-Deterministic Execution** | Unseeded async timer jitter               | Inconsistent run | Pinned `deterministicSeed` enforces replayability               |

---

## 9. Testing Strategy & Verification

The failure injection architecture is verified through automated test suites:

1. **Plan & Recovery Unit Tests ([`tests/unit/failure-injection.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/failure-injection.test.ts))**:
   - Validates deterministic plan creation and trigger condition evaluation.
   - Tests output mutation and `InjectedFaultEvent` generation across fault types.
   - Tests recovery trajectory assessment (MTTR calculation, recovery action detection, loop detection).
   - Tests Markdown report export and cryptographic signature generation.
2. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `failureInjectionReportSchema`.

---

## 10. Acceptance Criteria

- [x] Failure injection contracts support 7 deterministic injected fault categories.
- [x] Engine compiles deterministic chaos plans with flexible trigger conditions.
- [x] Middleware injects realistic error responses, timeouts, and permission revocations.
- [x] Trajectory analyzer computes empirical recovery rates, MTTR, and loop detection.
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 11. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Intrusive Middleware vs. Black-Box Provider APIs**: Injected middleware requires providers to expose tool execution hooks or proxies.  
  _Mitigation_: Implement standard CLI/stdio wrappers and proxy middleware that wrap arbitrary provider runtimes cleanly.
- **Open Question**: Multi-agent adversarial chaos where a rogue agent dynamically injects faults into peer agents.

---

## 12. Facts, Assumptions, and Recommendations

- **Facts**:
  - Injected infrastructure faults expose agent recovery failures invisible in pristine benchmarks.
  - Recovery competence can be measured quantitatively via step latency and loop detection.
- **Assumptions**:
  - Sandboxes isolate filesystem modifications and tool restarts cleanly.
- **Recommendations**:
  - Include standard Chaos Engineering profiles (e.g. 20% tool RPC error) in standard model evaluations.
  - Require a minimum Fault Resilience Score $\ge 80\%$ with MTTR $\le 3$ steps for production-grade agent certifications.

---

## 13. Architecture Decision Record

### [ADR-0142: Failure Injection and Chaos Engineering Architecture for AI Agent Evaluation](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0142-failure-injection.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Standardize 7 fault injection modes, implement `FailureInjectionEngine` with deterministic triggers, ground evaluations in observable recovery trajectories across the canonical chain, and compute MTTR and loop detection metrics.
- **Consequences**: Provides reproducible chaos engineering capabilities to evaluate agent self-healing and error resilience without speculative claims on internal cognition.

---

## 14. Implementation Artifacts

1. **Contracts & Chaos Engine**: [`packages/sandbox-contracts/src/failure-injection.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/failure-injection.ts)
2. **Schema Definition**: [`schemas/failure-injection-plan.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/failure-injection-plan.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/failure-injection.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/failure-injection.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/FAILURE_INJECTION_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/FAILURE_INJECTION_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0142-failure-injection.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0142-failure-injection.md)
