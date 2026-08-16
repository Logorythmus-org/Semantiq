# SemantIQ Sandbox Specification: Provider Economics and Sustainable Evaluation Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 33)  
**Status**: Approved Specification  
**Date**: 2026-08-15

---

## 1. Executive Summary

AI agent evaluation incurs tangible physical infrastructure costs: CPU core allocation, RAM residency, GPU time, storage I/O, network data transfer, and virtualization overheads. Uncontrolled agent loops or multi-step execution graphs can rapidly inflate cloud spend if economic boundaries and budget governors are not strictly enforced.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
`Benchmark → Scenario → Execution Contract → Provider Router → Provider Adapter → Runtime → Observation → Evidence → Evaluation → Report`

This specification defines the **Provider Economics Architecture**:

1. **Multi-Tier Economic Taxonomy**: Formalizes 5 economic operating tiers: `COMMUNITY_FREE` ($0.00 local), `SPONSORED_GRANT` (foundation/grant subsidized), `COMMERCIAL_PAYG` (metered cloud micro-billing), `ENTERPRISE_RESERVED` (dedicated infrastructure showback), and `REPLAY_TRACE` (zero compute cost).
2. **Economic Governor & Escrow Engine**: Evaluates pre-flight spend caps, enforces minimum billing increments, calculates data egress and cold-boot surcharges, and halts runs exceeding `EconomicBudgetCap`.
3. **Cryptographic Execution Receipts**: Emits signed `EconomicExecutionReceipt` manifests with immutable financial breakdowns, grant sponsor attributions, and departmental cost centers.
4. **Decoupling of Economics and Scoring Invariant**: Benchmark scores are strictly independent of provider tier or expenditure. A zero-cost local run is scored identically to a managed cloud run under identical benchmark conditions.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                      Economic Governor                                      |
|  [Benchmark Run Request] ──> [Pre-Flight Budget Check] ──> [Grant / Cost Center Escrow]     |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    Execution & Metering                                     |
|  • Wall-Clock & Hypervisor Duration Metering                                                |
|  • Network Ingress / Egress Byte Accounting                                                 |
|  • Cold-Boot Surcharge Calculation                                                          |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                Settlement & Receipt Issuance                                |
|  [Grant Deduction] ──> [Departmental Showback] ──> [Signed EconomicExecutionReceipt]       |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Scope and Non-Goals

### 2.1 In Scope

- **Economic Pricing Models**: Machine-readable contracts ([`EconomicPricingModel`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/economics.ts#L18-L27)) defining compute rates, billing units, minimum increments, data egress fees, and startup surcharges.
- **Grant & Sponsorship Allocation**: Managing foundation credit vouchers ([`EvaluationGrantAllocation`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/economics.ts#L29-L36)) with automated debiting and sponsor attribution.
- **Departmental Showback / Chargeback**: Tracking internal budget consumption ([`DepartmentalCostAllocation`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/economics.ts#L38-L43)) across organizational cost centers.
- **Budget Guardrails**: Hard capping per-run and per-suite spend ([`EconomicBudgetCap`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/economics.ts#L45-L51)) to prevent runaway cloud bills.
- **Cryptographic Provenance**: Signing financial receipts ([`EconomicExecutionReceipt`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/economics.ts#L53-L70)) embedded in public evaluation scorecards.
- **Behavioral Evaluation Preservation**: Ensuring financial metering never alters the observable behavioral sequence:
  $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$

### 2.2 Non-Goals

- **No Pay-To-Win Benchmark Scoring**: Financial spend never influences agent evaluation rubrics or benchmark leaderboards.
- **No Proprietary Payment Gateways in Core**: SemantIQ Core does not process credit cards or fiat banking transactions; it operates strictly on machine-readable unit pricing and credit accounting.
- **No Mandatory Commercial Providers**: Local-first $0.00 execution remains fully supported and zero-cost forever.

---

## 3. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Economic Governance & Budget Cap Enforcement (EconomicGovernor)                          |
|  • Pre-Flight Balance & Escrow Validation                                                   |
|  • Grant Debit & Subsidy Attribution Engine                                                 |
|  • Issuance & Cryptographic Signing of EconomicExecutionReceipt                             |
|  • Inclusion of Financial Provenance in Final Benchmark Reports                              |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standardized Metering Contracts)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Publishing Transparent Machine-Readable Pricing Manifests (EconomicPricingModel)        |
|  • Accurate Telemetry of Billed Duration & Egress Bandwidth Bytes                          |
|  • Immediate Process Teardown upon Receipt of Budget Abort Signals                         |
|  • External Fiat / Commercial Invoicing (Stripe, Cloud Invoices) Outside SemantIQ Core      |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 4. Contracts and Schemas

### 4.1 TypeScript Economic Interfaces ([`packages/sandbox-contracts/src/economics.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/economics.ts))

```typescript
export type EconomicTier =
  "COMMUNITY_FREE" | "SPONSORED_GRANT" | "COMMERCIAL_PAYG" | "ENTERPRISE_RESERVED" | "REPLAY_TRACE";

export type EconomicBillingUnit = "SECOND" | "MINUTE" | "HOUR" | "RUN" | "TOKEN_ESTIMATE";

export interface EconomicPricingModel {
  readonly tier: EconomicTier;
  readonly unit: EconomicBillingUnit;
  readonly baseUnitPrice: number;
  readonly currency: "USD" | "EUR" | "CREDITS" | "NONE";
  readonly minBillingIncrementSec: number;
  readonly egressCostPerGb: number;
  readonly coldBootSurcharge: number;
  readonly idleReservationCostPerMin: number;
}

export interface EvaluationGrantAllocation {
  readonly grantId: string;
  readonly sponsorOrganization: string;
  readonly totalCredits: number;
  readonly remainingCredits: number;
  readonly authorizedBenchmarkSuites: readonly string[];
  readonly expiresAt: string;
}

export interface DepartmentalCostAllocation {
  readonly costCenter: string;
  readonly projectTag: string;
  readonly allocatedBudget: number;
  readonly consumedBudget: number;
}

export interface EconomicBudgetCap {
  readonly maxSpendPerRun: number;
  readonly maxSpendPerSuite: number;
  readonly maxMonthlyBudget?: number;
  readonly currency: string;
  readonly hardCapEnforced: boolean;
}

export interface EconomicExecutionReceipt {
  readonly receiptId: string;
  readonly benchmarkId: string;
  readonly scenarioId: string;
  readonly providerId: string;
  readonly economicTier: EconomicTier;
  readonly billedDurationMs: number;
  readonly computeCost: number;
  readonly egressCost: number;
  readonly coldBootCost: number;
  readonly totalGrossCost: number;
  readonly grantSubsidyApplied: number;
  readonly netBilledCost: number;
  readonly currency: string;
  readonly sponsorAttribution?: string;
  readonly costCenter?: string;
  readonly timestamp: string;
  readonly receiptSignatureHex: string;
}
```

### 4.2 JSON Schema Manifests

- **[`schemas/provider-economics.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/provider-economics.schema.json)**: Validates economic execution receipts, pricing units, grant debits, and signatures.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `economicPricingModelSchema`, `evaluationGrantAllocationSchema`, and `economicExecutionReceiptSchema`.

---

## 5. User & Provider Economic Lifecycle Flow

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    1. Pre-Flight Reservation                                |
|  User initiates benchmark suite with EconomicBudgetCap ($5.00 max).                        |
|  EconomicGovernor verifies grant validity or checks departmental balance.                   |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                    2. Metered Execution                                     |
|  Sandbox executes agent actions. ISandboxObserver tracks runtime & network egress bytes.   |
|  Governor continuously checks running total against maxSpendPerRun.                        |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                               3. Post-Execution Settlement                                 |
|  Governor applies formula: Gross = Compute(rounded) + Egress + ColdBoot.                    |
|  If grantId present: GrantSubsidy applied, grant balance debited.                           |
|  If costCenter present: Departmental consumed budget incremented.                           |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                               4. Cryptographic Receipt Sealing                              |
|  Governor signs EconomicExecutionReceipt with private key; embeds receipt in final report.  |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 6. Security, Privacy, and Trust Posture

1. **Anti-Runaway Circuit Breakers**: If an agent gets trapped in an infinite execution loop or issues repetitive cloud tool calls, `EconomicGovernor` triggers an automated abort once `maxSpendPerRun` is reached, preventing catastrophic billing spikes.
2. **Cryptographic Financial Auditability**: All receipts are signed (`receiptSignatureHex`), ensuring that benchmark publishers cannot tamper with reported compute costs or falsify sponsorship claims.
3. **No Financial Telemetry Leaks**: Departmental cost centers and internal accounting tags are kept local to user environments unless explicitly opted in for public grant attribution.

---

## 7. Open-Source vs. Commercial & Enterprise Economics

| Economic Dimension     | Open-Source (`COMMUNITY_FREE`) | Sponsored (`SPONSORED_GRANT`) | Commercial (`COMMERCIAL_PAYG`) | Enterprise (`ENTERPRISE_RESERVED`) |
| :--------------------- | :----------------------------- | :---------------------------- | :----------------------------- | :--------------------------------- |
| **Compute Cost**       | $0.00 (Local CPU/GPU)          | Subsidized by Grant Credits   | Billed per sec/min             | Internal infrastructure chargeback |
| **Egress Bandwidth**   | $0.00 (Local Loopback)         | Subsidized                    | $0.05 - $0.12 per GB           | Corporate network amortized        |
| **Budget Enforcement** | Unlimited runs                 | Hard cap on grant credits     | Hard cap on cloud credit card  | Departmental monthly quota         |
| **Sponsor Disclosure** | Open Source Community          | e.g. "Sponsored by NSF AI"    | Commercial Cloud Tenant        | Enterprise Division Tag            |

---

## 8. Licensing and Compliance Boundary

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                               SemantIQ Core (MIT / Apache-2.0)                              |
|   Permissive codebase. Zero proprietary billing SDKs linked into core packages.             |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standard Economic Contracts & JSON Schema)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                         External Billing & Metering Systems                                 |
|  • Stripe / Invoicing APIs      ──> Managed entirely outside SemantIQ Core                  |
|  • Cloud Billing APIs (AWS/GCP) ──> Communicates via Adapter Layer / Webhooks               |
|  • Grant Foundation Catalogs    ──> Ingests Signed EvaluationGrantAllocation Manifests      |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

- **Clean-Room License Separation**: Financial manifests are pure metadata (JSON/YAML), ensuring zero GPL/AGPL contamination.

---

## 9. Failure Modes & Resilience Strategies

| Failure Mode             | Root Cause                             | Impact                    | Automated Recovery Action                                         |
| :----------------------- | :------------------------------------- | :------------------------ | :---------------------------------------------------------------- |
| **Budget Cap Exceeded**  | Agent enters infinite loop             | Runaway compute costs     | `EconomicGovernor` aborts sandbox execution immediately           |
| **Grant Expired**        | Grant timestamp in the past            | Subsidies rejected        | Fallback to `COMMUNITY_FREE` or prompt user for commercial key    |
| **Egress Spikes**        | Agent downloads large datasets         | Unanticipated egress bill | Metering checks egress threshold; throttles or halts download     |
| **Billing Discrepancy**  | Hypervisor clock vs wall-clock         | Overcharge dispute        | Receipts log both durations; discrepancies >5% flagged for review |
| **Departmental Overrun** | Project team exhausts quarterly budget | Benchmark blocked         | Soft alert to administrator or automatic switch to local OCI      |

---

## 10. Testing Strategy & Verification

The economic governance framework is verified through automated test suites:

1. **Pricing Calculation Unit Tests ([`tests/unit/provider-economics.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/provider-economics.test.ts))**:
   - Validates zero-cost calculation for community and replay tiers.
   - Tests per-second rounding, minimum duration floors, egress calculations, and cold-boot surcharges.
2. **Grant Deduction & Subsidy Tests**:
   - Tests partial and full subsidy application, credit balance updates, and expired grant rejection.
3. **Departmental Budget Showback Tests**:
   - Validates cost center registration and consumed balance accumulation.
4. **Budget Cap Auditing Tests**:
   - Tests automated detection and reporting of per-run and suite-level budget overruns.
5. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for all pricing, grant, and receipt schemas.

---

## 11. Acceptance Criteria

- [x] Economic pricing models support all 5 economic tiers without modifying SemantIQ Core.
- [x] Economic governor deterministically calculates compute, egress, and cold-boot costs.
- [x] Foundation grants apply subsidies and update remaining credit balances accurately.
- [x] Departmental cost centers track consumed budgets for organizational showback.
- [x] Benchmark scoring is 100% decoupled from financial spend or provider tier.
- [x] Full test suite (151 test files, 512 passing tests) passes cleanly with zero regressions.

---

## 12. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Granular Micro-Billing vs. Network Egress Volatility**: Egress costs can vary dynamically across cloud regions.  
  _Mitigation_: Pricing manifests define worst-case regional egress rates, and receipts record exact bytes transferred.
- **Open Question**: Standardization of multi-currency exchange rate snapshots for international academic benchmarks.

---

## 13. Facts, Assumptions, and Recommendations

- **Facts**:
  - SemantIQ Core evaluates agent behavior via objective, observable test assertions.
  - Evaluation results are identical regardless of whether compute was funded by grants, local CPU, or cloud instances.
- **Assumptions**:
  - Cloud providers meter compute at least down to 1-second granularity.
  - Evaluation grant sponsors provide signed grant allocation manifests.
- **Recommendations**:
  - Enforce a default $5.00 per-run `EconomicBudgetCap` on all new cloud provider configurations.
  - Automatically append signed `EconomicExecutionReceipt` blocks to public benchmark evidence bundles.

---

## 14. Architecture Decision Record

### [ADR-0133: Provider Economics and Sustainable Evaluation Architecture](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0133-provider-economics.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Define 5 economic tiers, implement `EconomicGovernor`, support foundation grant subsidies, enforce strict budget caps, issue cryptographically signed execution receipts, and decouple benchmark scores from financial spend.
- **Consequences**: Ensures long-term financial sustainability for academic, commercial, and open-source evaluation workloads while preventing runaway cloud billing.

---

## 15. Implementation Artifacts

1. **Contracts & Economic Governor**: [`packages/sandbox-contracts/src/economics.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/economics.ts)
2. **Schema Definition**: [`schemas/provider-economics.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/provider-economics.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/provider-economics.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/provider-economics.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/PROVIDER_ECONOMICS_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/PROVIDER_ECONOMICS_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0133-provider-economics.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0133-provider-economics.md)
