# SemantIQ Sandbox Specification: Terms, Attribution, NOTICE, and Commercial Compliance Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 35)  
**Status**: Approved Specification  
**Date**: 2026-08-15  

---

## 1. Executive Summary

AI evaluation ecosystems orchestrate multi-layered software stacks: scenario definitions, dataset packages, container base images, language runtimes, runtime virtualization daemons, and cloud infrastructure APIs. Each layer carries legal obligations: Apache-2.0 Section 4d NOTICE retention, MIT/BSD copyright preservation, CC-BY dataset attribution, trademark nominative fair-use boundaries, and research-only vs commercial use restrictions.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
`Benchmark → Scenario → Execution Contract → Provider Router → Provider Adapter → Runtime → Observation → Evidence → Evaluation → Report`

This specification defines the **Terms, Attribution, NOTICE, and Commercial Compliance Architecture**:
1. **Machine-Readable Attribution Protocol**: Standardizes structured declarations for notices (`AttributionNotice`), trademark disclaimers (`TrademarkDisclaimer`), and commercial usability terms (`CommercialRestrictionTerms`).
2. **Automated NOTICE & Attribution Compiler**: Employs [`ComplianceAttributionCompiler`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/terms-attribution.ts#L61-L165) to compile comprehensive, legally robust compliance packages (`ComplianceAttributionPackage`) with every benchmark execution run.
3. **Graduated Compliance Grades**: Evaluates and assigns clear compliance ratings: `FULLY_COMPLIANT`, `COMPLIANT_WITH_NOTICES`, `NON_COMMERCIAL_RESTRICTED`, and `NON_COMPLIANT_BLOCKED`.
4. **Trademark Fair-Use Protections**: Injects automated nominative fair-use disclaimers for third-party marks (Docker, Kubernetes, E2B, Modal) without asserting commercial affiliation or endorsement.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                               Compliance Attribution Compiler                               |
|  [Scenario Manifests] + [Image Licenses] + [Provider Descriptors] + [Trademark Rules]       |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                Compliance Validation Engine                                 |
|  • Verifies Mandatory SPDX Identifiers & Copyright Statements                               |
|  • Aggregates Apache-2.0 Section 4d NOTICE Blocks                                           |
|  • Checks Research-Only vs Commercial Use Clauses                                           |
|  • Injects Nominative Trademark Disclaimers                                                 |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                Sealed Compliance Package                                    |
|  [Signed ComplianceAttributionPackage] ──> [Embedded into Final Benchmark Evaluation Report]|
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Scope and Non-Goals

### 2.1 In Scope
- **Notice & Attribution Aggregation**: Extracting and assembling upstream copyright notices and Apache-2.0 NOTICE blocks into a unified format.
- **Trademark Nominative Fair-Use Disclaimers**: Providing clear disclaimers for all third-party container, orchestration, and cloud runtime marks.
- **Commercial Usability Governance**: Flagging research-only datasets or non-commercial benchmarks to protect enterprise deployments from IP infringements.
- **Machine-Readable Compliance Schemas**: Defining [`ComplianceAttributionPackage`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/terms-attribution.ts#L35-L47) and JSON Schema [`terms-attribution.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/terms-attribution.schema.json).
- **Behavioral Evaluation Preservation**: Ensuring legal and attribution workflows never alter the objective behavioral sequence:
  $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$

### 2.2 Non-Goals
- **No Formal Legal Advice**: Compliance classifications and terms are recorded as machine-readable technical facts without providing legal guarantees.
- **No OpenSandbox Fork or Clone**: Runtimes remain independent external systems; SemantIQ Core never duplicates vendor codebase files.
- **No Monetization or Licensing Gateways**: SemantIQ does not broker licenses or collect licensing royalties.

---

## 3. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Compliance Grammar & Attribution Contract Definitions                                    |
|  • Automated Aggregation of NOTICE Blocks & SPDX Metadata                                   |
|  • Enforcement of Compliance Grades (ComplianceAttributionCompiler)                         |
|  • Embedding Signed ComplianceAttributionPackage into Evaluation Evidence                   |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standardized Metadata Declarations)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Declaring Accurate SPDX Licenses & Copyright Statements for Hosted Runtimes              |
|  • Providing Trademark Usage Guidelines & Brand Policies                                    |
|  • Explicitly Declaring Commercial Usability and Terms of Service URLs                      |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 4. Contracts and Schemas

### 4.1 TypeScript Compliance Interfaces ([`packages/sandbox-contracts/src/terms-attribution.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/terms-attribution.ts))

```typescript
export type ComplianceGrade =
  | 'FULLY_COMPLIANT'
  | 'COMPLIANT_WITH_NOTICES'
  | 'NON_COMMERCIAL_RESTRICTED'
  | 'NON_COMPLIANT_BLOCKED';

export interface AttributionNotice {
  readonly component: string;
  readonly spdxLicense: string;
  readonly copyrightHolders: readonly string[];
  readonly noticeText: string;
  readonly sourceUrl?: string;
  readonly licenseSha256?: string;
}

export interface TrademarkDisclaimer {
  readonly mark: string;
  readonly owner: string;
  readonly usageContext: string;
  readonly disclaimerText: string;
}

export interface CommercialRestrictionTerms {
  readonly commercialUseAllowed: boolean;
  readonly researchOnlyClause: boolean;
  readonly patentRetaliationClause: boolean;
  readonly redistributionPermitted: boolean;
  readonly termsOfServiceUrl?: string;
  readonly termsVersion?: string;
}

export interface ComplianceAttributionPackage {
  readonly packageId: string;
  readonly benchmarkId: string;
  readonly scenarioId: string;
  readonly providerId: string;
  readonly generatedAt: string;
  readonly notices: readonly AttributionNotice[];
  readonly trademarks: readonly TrademarkDisclaimer[];
  readonly commercialTerms: CommercialRestrictionTerms;
  readonly complianceGrade: ComplianceGrade;
  readonly summaryMarkdown: string;
  readonly packageSignatureHex: string;
}
```

### 4.2 JSON Schema Manifests
- **[`schemas/terms-attribution.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/terms-attribution.schema.json)**: Validates compliance packages, attribution arrays, trademark blocks, and commercial terms.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `complianceAttributionPackageSchema`.

---

## 5. User & Provider Compliance Workflow

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    1. Metadata Declaration                                  |
|  Benchmark author submits scenario metadata with dataset licenses and source notices.      |
|  Execution provider submits ProviderLicensingManifest with runtime licensing and marks.    |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                    2. Automated Compilation                                 |
|  ComplianceAttributionCompiler aggregates notices, verifies SPDX, injects trademarks.       |
|  Evaluator validates commercial terms (e.g. flagging research-only restrictions).           |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                    3. Execution & Verification                              |
|  Benchmark executes normally. Compliance package is sealed alongside execution evidence.    |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                               4. Evaluation Report Publishing                               |
|  Report displays human-readable markdown attribution summary and machine-readable JSON.     |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 6. Security, Privacy, and Trust Posture

1. **Cryptographic Sealing**: Every `ComplianceAttributionPackage` is cryptographically signed (`packageSignatureHex`), ensuring that notice manifests cannot be stripped or altered in published benchmark artifacts.
2. **License Checksumming**: Optional `licenseSha256` checksums verify that the exact license text referenced at evaluation time has not been modified upstream.
3. **Enterprise Compliance Isolation**: Enterprise pipelines can configure hard blocks on any benchmark evaluated as `NON_COMMERCIAL_RESTRICTED` or `NON_COMPLIANT_BLOCKED`, ensuring zero corporate IP or licensing contamination.

---

## 7. Open-Source vs. Commercial & Enterprise Compliance Paths

| Compliance Dimension | Open-Source (`COMMUNITY_FREE`) | Academic (`RESEARCH_ONLY`) | Commercial / Enterprise (`ENTERPRISE`) |
| :--- | :--- | :--- | :--- |
| **Dataset Licensing** | Open Datasets (MIT, CC-BY-4.0) | Non-Commercial Research Use | Commercial Evaluation Cleared |
| **Compliance Grade** | `COMPLIANT_WITH_NOTICES` | `NON_COMMERCIAL_RESTRICTED` | `FULLY_COMPLIANT` |
| **Trademark Handling** | Nominative fair-use disclaimers | Nominative fair-use disclaimers | Corporate trademark guidelines verified |
| **NOTICE Handling** | Aggregated in report | Aggregated in report | Aggregated and archived for legal audit |

---

## 8. Failure Modes & Resilience Strategies

| Failure Mode | Root Cause | Impact | Automated Recovery Action |
| :--- | :--- | :--- | :--- |
| **Missing Notice Fields** | Author omits copyright or license | Incomplete legal notice | [`ComplianceAttributionCompiler`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/terms-attribution.ts#L61-L165) flags `NON_COMPLIANT_BLOCKED` |
| **Unannounced Commercial Restriction** | Upstream dataset adds research-only clause | Corporate license violation | Compiler detects clause; downgrades grade to `NON_COMMERCIAL_RESTRICTED` |
| **Trademark Dispute** | Proprietary vendor questions mark usage | Brand friction | Compiler ensures default nominative fair-use disclaimers are present |
| **Missing Apache NOTICE** | Section 4d NOTICE file stripped | License infringement | Compiler requires explicit noticeText field for Apache-2.0 components |

---

## 9. Testing Strategy & Verification

The compliance architecture is validated through automated test suites:
1. **Compilation & Formatting Unit Tests ([`tests/unit/terms-attribution.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/terms-attribution.test.ts))**:
   - Validates end-to-end compilation of notices, default trademark disclaimers, and commercial terms into markdown.
   - Tests `NON_COMMERCIAL_RESTRICTED` assignment for research-only clauses.
   - Tests detection and blocking of malformed notice records (`NON_COMPLIANT_BLOCKED`).
2. **Custom Trademark Disclaimer Tests**:
   - Validates injection of vendor-specific trademark disclaimers (e.g. E2B, Modal).
3. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `complianceAttributionPackageSchema`.

---

## 10. Acceptance Criteria

- [x] Terms, attribution, and NOTICE contracts support full legal transparency without core modification.
- [x] Compliance attribution compiler aggregates Apache-2.0 NOTICE blocks and copyright notices.
- [x] Standard nominative trademark fair-use disclaimers are automatically attached for third-party marks.
- [x] Commercial usability restrictions (research-only clauses) are evaluated and graded.
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 11. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Granular Per-Package Attribution vs. Report Size**: Embedding hundreds of deep transitive dependency notices can increase report size.  
  *Mitigation*: Deep transitive licenses are referenced via SPDX IDs and URLs, while primary components include full NOTICE blocks.
- **Open Question**: Implementing automated SPDX SBOM (Software Bill of Materials) generation (e.g., CycloneDX format) for enterprise container images.

---

## 12. Facts, Assumptions, and Recommendations

- **Facts**:
  - SemantIQ Core evaluates agent behavior via objective, observable test assertions.
  - Legal attribution packages are attached to evaluation artifacts without modifying scoring logic.
- **Assumptions**:
  - Benchmark scenario authors declare accurate SPDX identifiers in their scenario manifests.
- **Recommendations**:
  - Require `complianceGrade !== 'NON_COMPLIANT_BLOCKED'` as a mandatory prerequisite for public leaderboard publication.
  - Export the compiled `summaryMarkdown` as a standard `NOTICE.md` artifact with every evaluation evidence bundle.

---

## 13. Architecture Decision Record

### [ADR-0135: Terms Attribution, NOTICE Blocks, and Commercial Compliance Architecture](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0135-terms-attribution-and-compliance.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Standardize `AttributionNotice`, `TrademarkDisclaimer`, and `CommercialRestrictionTerms`; implement `ComplianceAttributionCompiler`; enforce compliance grades; and automatically bundle Apache-2.0 Section 4d NOTICE blocks.
- **Consequences**: Provides comprehensive, automated legal compliance and attribution transparency for all benchmark evaluations across academic, open-source, and commercial environments.

---

## 14. Implementation Artifacts

1. **Contracts & Compliance Compiler**: [`packages/sandbox-contracts/src/terms-attribution.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/terms-attribution.ts)
2. **Schema Definition**: [`schemas/terms-attribution.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/terms-attribution.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/terms-attribution.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/terms-attribution.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/TERMS_ATTRIBUTION_AND_COMPLIANCE_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/TERMS_ATTRIBUTION_AND_COMPLIANCE_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0135-terms-attribution-and-compliance.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0135-terms-attribution-and-compliance.md)
