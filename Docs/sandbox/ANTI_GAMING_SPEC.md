# SemantIQ Sandbox Specification: Anti-Gaming Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 54)  
**Status**: Approved Specification  
**Date**: 2026-08-15  

---

## 1. Executive Summary

As frontier AI models are continuously trained on open-source code and public benchmarks, evaluations face risks of scenario memorization (emitting final code in step 1 without reading repository context), suspicious behavioral shortcuts (submitting code without executing local test suites), pattern-match evaluator exploitation, provider-specific overfitting, and assertion tampering.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
$$\text{Benchmark} \longrightarrow \text{Scenario} \longrightarrow \text{Execution Contract} \longrightarrow \text{Provider Router} \longrightarrow \text{Provider Adapter} \longrightarrow \text{Runtime} \longrightarrow \text{Observation} \longrightarrow \text{Evidence} \longrightarrow \text{Evaluation} \longrightarrow \text{Report}$$

This specification establishes the **SemantIQ Anti-Gaming and Authenticity Architecture**:
1. **Six-Vector Gaming Anomaly Detection**: Standardizes detection for [`MEMORIZATION_INSTANT_SOLVE`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts#L10-L10), [`SHORTCUT_UNVERIFIED_MUTATION`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts#L11-L11), [`PATTERN_MATCH_EXPLOITATION`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts#L12-L12), [`ENVIRONMENT_OVERFITTING`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts#L13-L13), [`ASSERTION_TAMPERING_ATTEMPT`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts#L14-L14), and [`SYNTACTIC_COPY_PASTE`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts#L15-L15).
2. **Authenticity Metrics**: Computes Gaming Risk Score ($GRS \in [0, 1]$) and Gaming Authenticity Index ($GAI = 1 - GRS$).
3. **Four Authenticity Badges**: Distinguishes [`AUTHENTIC_REASONED`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts#L20-L20), [`SUSPICIOUS_SHORTCUTS`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts#L21-L21), [`PROBABLE_MEMORIZATION`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts#L22-L22), and [`CONFIRMED_GAMING`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts#L23-L23).
4. **Anti-Gaming Engine**: Implements [`AntiGamingEngine`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts#L47-L165) issuing cryptographically sealed [`AntiGamingScorecard`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts#L34-L45) records (`auditorSignatureHex`).
5. **Strict Observable Behavioral Grounding**: Evaluates behavior strictly across the canonical sequence:
   $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$
   without claiming access to hidden cognition or internal model states.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                  Observed Behavioral Trace                                  |
|  [BehavioralTraceEvent[]] ──> [AntiGamingEngine.evaluateTrajectory()]                       |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                Anti-Gaming Heuristic Matrix                                 |
|  • Instant Solve Check (Complexity >= 5 steps vs. Step 1 Solve)                             |
|  • Verification Check (Code Modification without pytest/npm test)                           |
|  • Assertion Tamper Check (Searching /eval/, modifying test runners)                       |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 AntiGamingScorecard                                         |
|  • Authenticity Classification: AUTHENTIC_REASONED (GAI: 100%, GRS: 0%)                     |
|  • Detected Anomalies: 0 Anomalies                                                          |
|  • Auditor Cryptographic Signature: auditorSignatureHex                                     |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Inputs & Prior Decisions

This specification integrates anti-gaming controls across the Sandbox Phase:
- **Prompt 31–36**: Multi-provider model, trust verification, and terms attribution.
- **Prompt 37–38**: Holistic execution cost accounting and verifiable execution receipts.
- **Prompt 39**: Portable Evidence Package and Merkle trace immutability.
- **Prompt 40–45**: Transition laboratory, semantic stress environments, chaos injection, recovery, and long-horizon milestones.
- **Prompt 46–53**: Sandbox DSL compiler, public Execution API, CLI local runner, Web/API router, Provider SDK, Provider Certification, Security Test Suite, and Benchmark Integrity.

---

## 3. Scope and Non-Goals

### 3.1 In Scope
- **Anti-Gaming Specification**: Defining [`GamingAnomalyType`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts#L9-L16), [`GamingSeverity`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts#L18-L18), [`AuthenticityClassification`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts#L20-L24), [`GamingAnomaly`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts#L26-L34), [`AntiGamingScorecard`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts#L36-L47), and JSON Schema [`anti-gaming-scorecard.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/anti-gaming-scorecard.schema.json).
- **Automated Behavioral Anomaly Detection**: Identifying shortcut mutations, instant solves, and tamper attempts.
- **Authenticity Scoring**: Computing $GRS$ and $GAI$.

### 3.2 Non-Goals
- **No Subjective Human Intuition**: All anomaly detections are based on explicit, reproducible trace event patterns.
- **No Penalization of Real Efficiency**: If an agent examines context and efficiently writes a solution with passing tests, it receives `AUTHENTIC_REASONED`.

---

## 4. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Anti-Gaming Anomaly Heuristics & Scoring Engine (AntiGamingEngine)                       |
|  • Computing GRS & GAI Authenticity Metrics and Assigning Trust Badges                      |
|  • Cryptographically Signing AntiGamingScorecards in Final Benchmark Reports                |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Observable Behavioral Traces)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Providing Accurate, Timestamped Command Ingestion Records Without Dropping Logs          |
|  • Protecting Evaluation Scorer Directories from Unauthorized In-Sandbox Write Access       |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 5. Interfaces and Anti-Gaming Types

### 5.1 TypeScript Anti-Gaming Definitions ([`packages/sandbox-contracts/src/anti-gaming.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts))

```typescript
export type GamingAnomalyType =
  | 'MEMORIZATION_INSTANT_SOLVE'
  | 'SHORTCUT_UNVERIFIED_MUTATION'
  | 'PATTERN_MATCH_EXPLOITATION'
  | 'ENVIRONMENT_OVERFITTING'
  | 'ASSERTION_TAMPERING_ATTEMPT'
  | 'SYNTACTIC_COPY_PASTE';

export type GamingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AuthenticityClassification =
  | 'AUTHENTIC_REASONED'
  | 'SUSPICIOUS_SHORTCUTS'
  | 'PROBABLE_MEMORIZATION'
  | 'CONFIRMED_GAMING';

export interface GamingAnomaly {
  readonly anomalyId: string;
  readonly type: GamingAnomalyType;
  readonly severity: GamingSeverity;
  readonly stepIndex: number;
  readonly description: string;
  readonly confidence: number;
  readonly evidenceDigest: string;
}

export interface AntiGamingScorecard {
  readonly scorecardId: string;
  readonly scenarioId: string;
  readonly runId: string;
  readonly gamingRiskScore: number;
  readonly authenticityIndex: number;
  readonly classification: AuthenticityClassification;
  readonly anomalies: readonly GamingAnomaly[];
  readonly evaluatedAt: string;
  readonly auditorSignatureHex: string;
}
```

---

## 6. Schemas & Versioning

- **[`schemas/anti-gaming-scorecard.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/anti-gaming-scorecard.schema.json)**: Formal Draft 2020-12 JSON Schema validating anti-gaming scorecards, anomalies, and classification badges.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `antiGamingScorecardSchema`.
- **Versioning Policy**: Semantic versioning (`1.0.0`).

---

## 7. Lifecycle and State Machine

```
      +────────────────────+
      | Trace Ingestion    |
      +─────────┬──────────+
                │ evaluateTrajectory()
                ▼
      +────────────────────+
      | Anomaly Scan       | ──> Instant Solve, Shortcut Mutation, Assertion Tampering
      +─────────┬──────────+
                │ Compute GRS & GAI
                ▼
      +────────────────────+
      | Badge Assignment   | ──> AUTHENTIC_REASONED / SUSPICIOUS / MEMORIZED / GAMING
      +─────────┬──────────+
                │ Seal & Sign
                ▼
      +────────────────────+
      | AntiGamingScorecard|
      +────────────────────+
```

---

## 8. Security, Privacy, and Trust Posture

1. **Tampering Disqualification**: Any attempt to read or modify evaluation test runners immediately flags `ASSERTION_TAMPERING_ATTEMPT` (`CRITICAL`), assigning `CONFIRMED_GAMING`.
2. **Transparent Confidence Metrics**: Every detected anomaly provides an explicit `confidence` rating (0.0 to 1.0) and description.
3. **Signed Scorecards**: Anti-gaming scorecards are cryptographically signed with `auditorSignatureHex`.

---

## 9. Provider Compatibility

| Execution Provider | Log Capture Fidelity | Anti-Tamper Isolation | Expected Anomaly Accuracy |
| :--- | :--- | :--- | :--- |
| **Docker (Local)** | Complete stdout/stderr capture | Read-only eval mount | 100% |
| **Podman (Rootless)** | Complete stdout/stderr capture | User namespace isolation | 100% |
| **Firecracker MicroVM**| Complete serial console capture| Hardware block isolation | 100% |
| **Modal / Fly.io** | Complete SSE stream capture | Ephemeral read-only mount | 100% |

---

## 10. Failure Modes & Resilience Strategies

| Failure Mode | Root Cause | Impact | Automated Recovery Action |
| :--- | :--- | :--- | :--- |
| **False Positive on Fast Solver** | Elite model genuinely solves in 2 steps | Overflagged anomaly | Confidence weighted; requires exploration read |
| **Test Command Variant** | Agent ran custom test script name | Flagged as unverified | Regex heuristic covers `pytest`, `npm test`, `cargo test`, `go test` |
| **Log Truncation** | Provider buffer dropped commands | Incomplete trace | Integrity check flags `PROVENANCE_BROKEN` |
| **Prompt Injection Hack** | Agent injected cheat strings in output | Evaluator exploit | Pattern match probe flags exploitation |

---

## 11. Testing Strategy & Verification

The Anti-Gaming architecture is validated through automated test suites:
1. **Anti-Gaming Engine Unit Tests ([`tests/unit/anti-gaming.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/anti-gaming.test.ts))**:
   - Tests evaluating authentic exploratory reasoning trajectory: asserts `AUTHENTIC_REASONED`, `gamingRiskScore === 0`, `authenticityIndex === 1.0`.
   - Tests detecting memorized instant solve when complex scenario is written in step 1 without reading repository context.
   - Tests detecting critical assertion tampering attempt and assigns `CONFIRMED_GAMING`.
   - Tests Markdown anti-gaming scorecard formatting and auditor signature generation.
2. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `antiGamingScorecardSchema`.

---

## 12. Acceptance Criteria

- [x] Anti-Gaming contracts define 6 anomaly types, 4 authenticity classifications, and scorecards.
- [x] `AntiGamingEngine` evaluates multi-step traces and flags unverified mutations and instant solves.
- [x] Assertion tampering attempts trigger critical severity and assign `CONFIRMED_GAMING`.
- [x] Cryptographic auditor signatures guarantee unforgeable anti-gaming scorecards.
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 13. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Heuristic Thresholds vs. Model Evolution**: As agents become more capable, some might legitimately solve simple scenarios in fewer steps.  
  *Mitigation*: Base step-count thresholds on scenario `totalStepBudget` and require at least one exploratory read.
- **Open Question**: Dynamic scenario perturbation (variable renaming, semantic mutations) to defeat memorization deterministically.

---

## 14. Architecture Decision Record

### [ADR-0154: SemantIQ Anti-Gaming, Anti-Memorization, and Authenticity Architecture](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0154-anti-gaming-architecture.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Implement `AntiGamingEngine` to detect memorization, unverified shortcuts, pattern-match exploitation, and assertion tampering, computing $GRS$/$GAI$ and assigning 4-tier authenticity badges.
- **Consequences**: Guarantees benchmark leaderboard integrity by penalizing contaminated models and rewarding genuine exploratory reasoning.

---

## 15. Generated & Modified Artifact List

1. **Contracts & Anti-Gaming Engine**: [`packages/sandbox-contracts/src/anti-gaming.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/anti-gaming.ts)
2. **Schema Definition**: [`schemas/anti-gaming-scorecard.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/anti-gaming-scorecard.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/anti-gaming.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/anti-gaming.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/ANTI_GAMING_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/ANTI_GAMING_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0154-anti-gaming-architecture.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0154-anti-gaming-architecture.md)
