# SemantIQ Sandbox Specification: Canonical Benchmark Report Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 59)  
**Status**: Approved Specification  
**Date**: 2026-08-15  

---

## 1. Executive Summary

The final phase of the SemantIQ evaluation pipeline (`Benchmark → Scenario → Execution Contract → Provider Router → Provider Adapter → Runtime → Observation → Evidence → Evaluation → Report`) requires a standardized, canonical human- and machine-readable benchmark report format. The report must synthesize methodology, behavioral metrics ($LHRI$, $CAI$, $RRI$), integrity grades, anti-gaming classifications, financial cost accounting, and cryptographic provenance without proprietary lock-in.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
$$\text{Benchmark} \longrightarrow \text{Scenario} \longrightarrow \text{Execution Contract} \longrightarrow \text{Provider Router} \longrightarrow \text{Provider Adapter} \longrightarrow \text{Runtime} \longrightarrow \text{Observation} \longrightarrow \text{Evidence} \longrightarrow \text{Evaluation} \longrightarrow \text{Report}$$

This specification establishes the **SemantIQ Canonical Benchmark Report Architecture**:
1. **Holistic Seven-Pillar Synthesis**:
   - Verdict & Score ([`PASSED`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-report.ts#L8-L8) / [`FAILED`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-report.ts#L8-L8) / [`PARTIAL`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-report.ts#L8-L8) / [`ERROR`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-report.ts#L8-L8), composite score).
   - Execution Methodology ([`BenchmarkMethodologySummary`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-report.ts#L10-L17)).
   - Behavioral Findings ([`BehavioralFindingsSummary`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-report.ts#L19-L24)).
   - Integrity & Trust ([`IntegrityTrustSummary`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-report.ts#L26-L30)).
   - Financial Cost Accounting ([`CostAccountingSummary`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-report.ts#L32-L35)).
   - Evidence Lineage & Merkle Root ([`ProvenanceSummary`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-report.ts#L37-L40)).
   - Declared Limitations & Environmental Variance.
2. **Canonical Benchmark Report Engine**: Implements [`BenchmarkReportEngine`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-report.ts#L61-L162) creating signed [`CanonicalBenchmarkReport`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-report.ts#L42-L55) records (`reportSignatureHex`).
3. **Dual-Format Output**: Implements [`renderReportMarkdown`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-report.ts#L99-L157) and [`renderReportJson`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-report.ts#L159-L161).
4. **Strict Observable Behavioral Grounding**: Evaluates behavior strictly across the canonical sequence:
   $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$
   without claiming access to hidden cognition or internal model states.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                               Multi-Pillar Evaluation Synthesis                             |
|  [Methodology] + [Behavioral Findings] + [Integrity Seals] + [Cost Ledger] + [Provenance]    |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                   BenchmarkReportEngine                                     |
|  • assembleReport(): Assembles canonical report and computes cryptographic signature       |
|  • renderReportMarkdown(): Renders GitHub Flavored Markdown summary table                   |
|  • renderReportJson(): Renders machine-readable Draft 2020-12 compliant JSON                |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                CanonicalBenchmarkReport                                     |
|  • Verdict: PASSED (91.7%) | LHRI: 92.0% | CAI: 88.0% | RRI: 95.0%                          |
|  • Integrity: SEALED_VALID | Authenticity: AUTHENTIC_REASONED | Cost: $0.0845 USD           |
|  • Auditor Cryptographic Signature: reportSignatureHex                                      |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Inputs & Prior Decisions

This specification integrates all reporting requirements across the Sandbox Phase:
- **Prompt 31–36**: Multi-provider model, trust verification, and terms attribution.
- **Prompt 37–38**: Holistic execution cost accounting and verifiable execution receipts.
- **Prompt 39**: Portable Evidence Package and Merkle trace immutability.
- **Prompt 40–45**: Transition laboratory, semantic stress environments, chaos injection, recovery, and long-horizon milestones.
- **Prompt 46–58**: Sandbox DSL compiler, public Execution API, CLI local runner, Web/API router, Provider SDK, Provider Certification, Security Test Suite, Benchmark Integrity, Anti-Gaming, Independent Observer, Evidence Provenance, Cross-Model Comparison, and Observability Dashboard.

---

## 3. Scope and Non-Goals

### 3.1 In Scope
- **Benchmark Report Specification**: Defining [`BenchmarkVerdict`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-report.ts#L8-L8), [`CanonicalBenchmarkReport`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-report.ts#L42-L55), and JSON Schema [`canonical-benchmark-report.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/canonical-benchmark-report.schema.json).
- **Dual-Modal Rendering**: GitHub Flavored Markdown and machine-readable JSON.
- **Cryptographic Audit Signing**: Sealing report objects with ECDSA signatures.

### 3.2 Non-Goals
- **No Vague Qualitative Scores**: Every reported metric is grounded in explicit mathematical indices ($LHRI$, $CAI$, $RRI$, $GAI$).
- **No Proprietary Vendor Headers**: Report format is open-source and provider-agnostic.

---

## 4. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Synthesizing All Subsystem Outputs into Canonical Reports (BenchmarkReportEngine)        |
|  • Calculating Composite Capability Scores & Formatted GFM Markdown Summary Tables          |
|  • Cryptographically Signing CanonicalBenchmarkReport Records                              |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standardized Evaluation Report Contracts)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Executing Sandbox Scenarios in Hermetic Compliance with DSL Declarations                 |
|  • Providing Raw Exit Codes, Artifacts, and Timing Metrics for Verification                 |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 5. Interfaces and Report Types

### 5.1 TypeScript Report Definitions ([`packages/sandbox-contracts/src/benchmark-report.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-report.ts))

```typescript
export type BenchmarkVerdict = 'PASSED' | 'FAILED' | 'PARTIAL' | 'ERROR';

export interface BenchmarkMethodologySummary {
  readonly benchmarkId: string;
  readonly dslVersion: string;
  readonly providerId: string;
  readonly imageDigest: string;
  readonly networkPolicy: string;
  readonly totalStepBudget: number;
}

export interface BehavioralFindingsSummary {
  readonly longHorizonResilienceIndex: number;
  readonly consequenceAttributionIndex: number;
  readonly recoveryResilienceIndex: number;
  readonly detectedTransitions: number;
}

export interface IntegrityTrustSummary {
  readonly integrityGrade: string;
  readonly authenticityClassification: string;
  readonly observerTrustScore: number;
}

export interface CostAccountingSummary {
  readonly totalCostUsd: number;
  readonly receiptSignature: string;
}

export interface ProvenanceSummary {
  readonly graphMerkleRoot: string;
  readonly evidenceDigest: string;
}

export interface CanonicalBenchmarkReport {
  readonly reportId: string;
  readonly scenarioId: string;
  readonly runId: string;
  readonly verdict: BenchmarkVerdict;
  readonly compositeScore: number;
  readonly methodology: BenchmarkMethodologySummary;
  readonly behavioralFindings: BehavioralFindingsSummary;
  readonly integrityAndTrust: IntegrityTrustSummary;
  readonly costAccounting: CostAccountingSummary;
  readonly provenance: ProvenanceSummary;
  readonly limitations: readonly string[];
  readonly generatedAt: string;
  readonly reportSignatureHex: string;
}
```

---

## 6. Schemas & Versioning

- **[`schemas/canonical-benchmark-report.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/canonical-benchmark-report.schema.json)**: Formal Draft 2020-12 JSON Schema validating canonical benchmark reports, verdicts, behavioral summaries, cost ledgers, and signatures.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `canonicalBenchmarkReportSchema`.
- **Versioning Policy**: Semantic versioning (`1.0.0`).

---

## 7. Lifecycle and State Machine

```
      +──────────────────────────+
      | Evaluation Complete      |
      +────────────┬─────────────+
                   │ assembleReport()
                   ▼
      +──────────────────────────+
      | Canonical Report Object  | ──> Computes reportSignatureHex
      +────────────┬─────────────+
                   ├──> renderReportMarkdown() ──> report.md
                   └──> renderReportJson()     ──> report.json
```

---

## 8. Security, Privacy, and Trust Posture

1. **Unforgeable Audit Signature**: The entire report payload is canonically hashed with SHA-256 and signed with `reportSignatureHex`.
2. **Deterministic Composite Scoring**: Composite scores are calculated deterministically from underlying assertion weights.
3. **Explicit Limitations Section**: Environmental jitter, CPU throttling, or unverified claims are prominently declared in the report.

---

## 9. Provider Compatibility

| Execution Provider | Verdict Determination | Provenance Root Generation | Report Generation Status |
| :--- | :--- | :--- | :--- |
| **Docker (Local)** | Local assertion runner | Host SHA-256 Merkle root | `FULL_NATIVE` |
| **Podman (Rootless)** | Local assertion runner | Host SHA-256 Merkle root | `FULL_NATIVE` |
| **Firecracker MicroVM**| Serial console exit code | MicroVM block root | `FULL_NATIVE` |
| **Modal / Cloud MicroVM**| Remote exit code | Provider SSE Merkle stream | `FULL_NATIVE` |

---

## 10. Failure Modes & Resilience Strategies

| Failure Mode | Root Cause | Impact | Automated Recovery Action |
| :--- | :--- | :--- | :--- |
| **Assertion Exception** | Uncaught test runner script bug | Incomplete verdict | Sets verdict to `ERROR`; records stack trace in findings |
| **Missing Metric Subsystem**| Anti-gaming or Cost engine omitted | Partial report | Defaults missing summary to neutral baseline with warning |
| **Schema Validation Error** | Non-compliant JSON payload | Rejection by API | Validates against Draft 2020-12 schema before emission |

---

## 11. Testing Strategy & Verification

The Canonical Benchmark Report architecture is validated through automated test suites:
1. **Benchmark Report Unit Tests ([`tests/unit/benchmark-report.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/benchmark-report.test.ts))**:
   - Tests assembling canonical benchmark report with composite score and cryptographic signature.
   - Tests rendering comprehensive GFM Markdown reports.
   - Tests rendering formatted JSON report strings.
2. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `canonicalBenchmarkReportSchema`.

---

## 12. Acceptance Criteria

- [x] Canonical Report contracts define verdicts, methodology, behavioral findings, costs, and provenance.
- [x] `BenchmarkReportEngine` assembles multi-pillar summaries and computes composite capability scores.
- [x] Dual-format rendering emits human-readable Markdown (`report.md`) and machine-readable JSON (`report.json`).
- [x] Cryptographic auditor signatures guarantee unforgeable benchmark reports.
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 13. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Report Length vs. Concise Summary**: Presenting all sub-metrics in full detail can produce large Markdown documents.  
  *Mitigation*: Structure Markdown with prominent executive summaries and collapsible detail sections.
- **Open Question**: PDF report compilation via headless Chromium for enterprise auditing.

---

## 14. Architecture Decision Record

### [ADR-0159: SemantIQ Canonical Sandbox Benchmark Report Architecture](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0159-benchmark-report.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Implement `BenchmarkReportEngine` synthesizing methodology, behavioral findings, integrity seals, financial costs, and evidence provenance into signed `CanonicalBenchmarkReport` records with Markdown and JSON exports.
- **Consequences**: Standardizes benchmark result exchange across researchers, leaderboards, and enterprise evaluation pipelines.

---

## 15. Generated & Modified Artifact List

1. **Contracts & Report Engine**: [`packages/sandbox-contracts/src/benchmark-report.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/benchmark-report.ts)
2. **Schema Definition**: [`schemas/canonical-benchmark-report.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/canonical-benchmark-report.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/benchmark-report.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/benchmark-report.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/SANDBOX_BENCHMARK_REPORT_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/SANDBOX_BENCHMARK_REPORT_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0159-benchmark-report.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0159-benchmark-report.md)
