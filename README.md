# SemantIQ: Behavioral Evidence Infrastructure for AI Systems

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Public Alpha: 0.1.0-alpha.2](https://img.shields.io/badge/Public%20Alpha-0.1.0--alpha.2-orange.svg)](CHANGELOG.md)
[![TypeScript SDK](https://img.shields.io/badge/TypeScript%20SDK-%40semantiq%2Fsdk-blue.svg)](Docs/TYPESCRIPT_SDK.md)
[![Python SDK](https://img.shields.io/badge/Python%20SDK-semantiq-blue.svg)](Docs/PYTHON_USAGE.md)
[![API: Headless HTTP](https://img.shields.io/badge/HTTP%20API-v1-orange.svg)](Docs/HTTP_API_REFERENCE.md)
[![Scientific Guardrails: Enforced](https://img.shields.io/badge/Scientific%20Guardrails-Enforced-brightgreen.svg)](Docs/SCIENTIFIC_GUARDRAILS.md)

**SemantIQ is Behavioral Evidence Infrastructure for AI Systems.**

SemantIQ transforms raw execution traces and benchmark logs into verifiable empirical observations, matched statistical contrasts, robustness evaluations, governed evidence claims, and cryptographically sealed research bundles for cross-organization replication.

**Version model:** the current software identity is `0.1.0-alpha.2`, with
**Public Alpha (Experimental)** maturity. The TypeScript SDK uses the same SemVer
spelling and Python uses the PEP 440 equivalent `0.1.0a2`. Contract and payload
schemas are independently versioned at `1.0.0`, while the HTTP route family is
`/api/v1`. A schema, API, benchmark, or documentation `1.0.0` does not claim a
stable SemantIQ software release. See [Versioning & Release Policy](Docs/VERSIONING_POLICY.md).

## Current Maturity and Evidence Status

SemantIQ `0.1.0-alpha.2` is **Public Alpha (Experimental)**. It is intended for
technical evaluation, local experimentation, and reproducible research workflows.
It is **not production-ready**, not a certification authority, and not presented as
an independently validated standard.

| Evidence state            | Current public status                                                                                                                                                                                       |
| :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **IMPLEMENTED**           | The headless TypeScript and Python interfaces, CLI and HTTP surfaces, deterministic validation gates, and evidence/claim workflows are present in the repository and exercised by internal automated tests. |
| **INTERNALLY VALIDATED**  | Owner-controlled CI, local execution, and documented clean-room exercises provide internal reproducibility evidence. Clean-room execution within the project environment is not independent replication.    |
| **EXTERNALLY REPLICATED** | Not yet established. No independent third-party replication or audit has been verified; implemented partner and replication mechanisms are capabilities, not external evidence.                             |
| **NOT YET VALIDATED**     | Production-scale reliability, real-world adoption, ecosystem-scale governance, and resistance to unforeseen public benchmark gaming remain unvalidated.                                                     |

See the [Public Alpha limitations](PHASE_12_PUBLIC_LIMITATIONS.md) and
[Scientific Guardrails](Docs/SCIENTIFIC_GUARDRAILS.md) for the detailed evidence
and claim boundaries.

Independent third parties can follow the
[replication guide](Docs/REPRODUCTION_WALKTHROUGH.md) and submit an
[Independent Replication Report](https://github.com/Logorythmus-org/Semantiq/issues/new?template=independent_replication_report.yml).
A submitted or successful reproduction attempt is not verified external replication until its
provenance and independence are reviewed and explicitly accepted.

See the [Integration Graph](Docs/ecosystem/INTEGRATION_GRAPH.md) for evidence-backed runtime,
storage, execution, exchange, and experimental ecosystem relationships.

```
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│    BENCHMARK ENGINE     │ ──► │     EVIDENCE ENGINE     │ ──► │   RESEARCH WORKBENCH    │
│  Execution, Traces,     │     │  Contrast, Robustness,  │     │  Claims, Prereg, Gate,  │
│  Metrics & Benchmarks   │     │  Graph, Decision Policy │     │  Bundles & Replications │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
```

Existing benchmark families (**SMF**, **HACS**, **Vision**, etc.) operate as modular test batteries atop the Benchmark Engine within the broader evidence infrastructure.

---

## The Three Subsystems

### 1. Benchmark Engine

- **Execution Connectors & Adapters**: Docker Engine execution is implemented with partial live-daemon validation. OCI contracts are available; Podman and named cloud-provider compatibility are not verified.
- **Cryptographic Trace Capture**: Generates state-chained `Trace` and `TraceEvent` structures with SHA-256 Merkle proofs.
- **Behavioral Metrics Extraction**: Normalizes step latencies, tool execution successes/failures, token consumption, and domain-specific scores.
- **Benchmark Suite Families**: Integrates structured evaluation batteries (e.g. SMF, HACS long-horizon, Multimodal Vision) producing canonical run artifacts.

### 2. Evidence Engine

- **Canonical Observation Normalization**: Translates raw execution anomalies into empirical `EvidenceObservation` items with strict epistemic tagging.
- **Evidence Graph**: Maintains directed graph structures connecting system patterns (e.g., `DP-008` Out-of-Band Observer) to failure patterns (e.g., `FP-002` Context Drift) with explicit relationship types (`SUPPORTS`, `REFUTES`, `MITIGATES`).
- **7-Dimensional Matched Statistical Contrast**: Matches treatment and control runs across `environment`, `model`, `population`, `tools`, `memory`, `resource_pressure`, and `horizon`; calculates 1,000-iteration Bootstrap Confidence Intervals and Exact Sign Tests.
- **Robustness Diagnostics**: Quantifies Total Variation Distance ($TVD \le 0.05$), executes placebo negative controls, and analyzes leave-out perturbation stability.
- **Specification Curve Analysis**: Systematically executes all valid model-environment combinations to measure directional consistency ($directionStabilityRatio$).
- **Evidence Decision Policy**: Evaluates statistical power and robustness metrics against deterministic governance policies to output evidence verdicts (`promote`, `hold`, `downgrade`, `insufficient`).

### 3. Research Workbench

- **Governed Claim Registry**: Drafts, reviews, and releases formal scientific claims linked directly to underlying runs, observations, and statistical reports.
- **Controlled Language Rules**: Strictly blocks unhedged, unsupported causal language (e.g. `causes`, `proves`, `guarantees`, `eliminates`).
- **Two-Party Review & Release Gate**: Requires independent peer approvals before promoting claims to `active` status.
- **Reproducible Research Bundles**: Packages claims, datasets, code hashes, and contrast reports into Merkle-tree verified bundles (`ResearchBundleManifest`).
- **Study Protocol Pre-registration**: Generates deterministic study protocols with negative controls, freezing immutable pre-registration fingerprints (`freezeProtocol`).
- **Protocol-Aware Execution Manifests**: Ingests external partner results, validating adherence against pre-registered designs.
- **External Evidence Eligibility Gate**: Evaluates submissions across 7 dimensions into deterministic verdicts (`eligible`, `eligible_with_caveats`, `quarantined`, `rejected`) before permitting evidence to affect aggregate registries.
- **Partner Replication Registry**: Aggregates multi-organizational replications while guaranteeing counterevidence visibility and requiring genuine context diversity ($\ge 2$ independent orgs, diversity score $\ge 0.70$) for E4 promotion.

---

## Scientific Guardrails & Epistemic Invariants

SemantIQ enforces 16 epistemic guardrails across code, contracts, and APIs:

| Invariant                                    | Principle                                                           | Enforcement Mechanism                                     |
| :------------------------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------- |
| **Observed $\neq$ Inferred**                 | Inferences must never be represented as empirical observations.     | Tagged `EpistemicNature.OBSERVED` vs `INFERRED`.          |
| **Zero Architecture Hallucinations**         | Architecture-only facts produce 0 failure observations.             | Strict bridge verification (`totalFailuresExtracted: 0`). |
| **Absence $\neq$ Counterevidence**           | Unobserved cells remain `no_observation` at $R0$.                   | Absence does not penalize hypotheses.                     |
| **Matched Association $\neq$ Causal Effect** | Matched contrast reflects association, not causal identification.   | Attached `EPISTEMIC_CAUSAL_DISCLAIMER`.                   |
| **Robustness $\neq$ Causality**              | Robustness across specifications does not prove causation.          | Attached `EPISTEMIC_ROBUSTNESS_DISCLAIMER`.               |
| **Promotion $\neq$ Proof**                   | Promotion signifies governance criteria fulfillment, not proof.     | Attached `EPISTEMIC_GOVERNANCE_DISCLAIMER`.               |
| **Controlled Scientific Language**           | Claims must not contain unhedged causal terms.                      | Deterministic regex blocklist in `ClaimRegistryEngine`.   |
| **Release Controls Wording, Not Truth**      | Governance governs statement phrasing, not universal truth.         | Attached `EPISTEMIC_LANGUAGE_DISCLAIMER`.                 |
| **No Auto-Claim Mutation**                   | Evidence Watch generates proposals; claims are never auto-mutated.  | Proposals require human review.                           |
| **Bundle Integrity $\neq$ Truth**            | Merkle verification proves integrity and provenance, not truth.     | Attached `EPISTEMIC_BUNDLE_DISCLAIMER`.                   |
| **Counterevidence Visible**                  | Counterevidence is never hidden or filtered from replication views. | Enforced `counterevidencePreserved: true`.                |
| **E4 Context Diversity**                     | E4 requires $\ge 2$ independent orgs and diversity $\ge 0.70$.      | Enforced in `ReplicationRegistryEngine`.                  |
| **Preregistration $\neq$ Truth**             | Pre-registration guards against p-hacking, not truth.               | Attached `EPISTEMIC_PREREGISTRATION_DISCLAIMER`.          |
| **Material Deviations Cap Evidence**         | Deviations during/after execution cap maximum evidence tier.        | Enforced in `ProtocolDeviationLedger`.                    |
| **No Attestation Alone Promotes**            | Attestation without verified data cannot promote evidence.          | Attached `EPISTEMIC_MANIFEST_DISCLAIMER`.                 |
| **Gate Eligibility $\neq$ Truth**            | Admissibility determines aggregation rights, not truth.             | Attached `EPISTEMIC_GATE_DISCLAIMER`.                     |

---

## Headless & UI-Independent Architecture

SemantIQ is built from the ground up as a **headless infrastructure layer**. It contains zero mandatory web frontend dependencies and can be operated entirely through:

1. **Python Public API** (`semantiq`)
2. **TypeScript SDK** (`@semantiq/sdk`)
3. **Unified CLI** (`semantiq`)
4. **Headless HTTP API** (`SemantiqHttpRouter`)

---

## Multi-Interface Usage

### 1. Python Public API

The provisional `0.1.0-alpha.2` Public Alpha is experimental and is not published on
PyPI. From a repository checkout, install the Python package in editable mode:

```bash
python -m pip install -e "./packages/python"
```

Draft a governed claim and evaluate controlled language:

```python
from semantiq import (
    SemantiqClient,
    validate_claim_language,
    StudyProtocolGenerator,
    ExternalEvidenceEligibilityGate,
)

# 1. Validate controlled scientific language
validation = validate_claim_language(
    "DP-008 out-of-band observer is associated with a 0.25 observed increase in goal retention."
)
assert validation["is_valid"] is True

# 2. Initialize Headless Client
client = SemantiqClient(is_offline_deterministic=True)

# 3. Draft Governed Claim
claim = client.draft_claim(
    topic="anti_gaming_drift_mitigation",
    target_pattern_id="rel_08",
    statement=validation["sanitized_statement"],
    run_ids=["run_treatment_1", "run_control_1"],
)
print(f"Drafted Claim ID: {claim.id} (Status: {claim.status})")
```

For complete Python documentation, see **[Docs/PYTHON_USAGE.md](Docs/PYTHON_USAGE.md)**.

---

### 2. TypeScript SDK

The provisional `0.1.0-alpha.2` Public Alpha is experimental and is not published on
npm. Use the SDK from the checked-out pnpm workspace:

```bash
pnpm install --frozen-lockfile
pnpm test:sdk
```

Match controlled runs and evaluate statistical contrast:

```typescript
import { SemantiqClient } from "@semantiq/sdk";

const client = new SemantiqClient({ isOfflineDeterministic: true });

// 1. Match treatment and control runs
const matchedData = client.matchControls({
  treatmentRuns: treatmentRunProfiles,
  controlRuns: controlRunProfiles,
  targetMetric: "goal_retention_score"
});

// 2. Evaluate 1,000-resample Bootstrap CI and Sign Test
const contrastReport = client.evaluateContrast({
  targetMetric: "goal_retention_score",
  matchedData
});

console.log(`Mean Delta: ${contrastReport.meanDelta}, Grade: ${contrastReport.evidenceGrade}`);
```

For complete TypeScript SDK documentation, see **[Docs/TYPESCRIPT_SDK.md](Docs/TYPESCRIPT_SDK.md)**.

---

### 3. Command-Line Interface (CLI)

Run doctor diagnostics, execute benchmark workflows, and manage governed claims:

```bash
# Diagnostic health check
semantiq doctor

# Validate controlled claim language
semantiq claims validate "DP-008 is associated with reduced FP-002 drift."

# List discovered failure and design patterns
semantiq patterns list

# Inspect evidence graph relationships
semantiq evidence graph

# Start Headless HTTP API Server
semantiq serve --port 3000
```

For complete CLI documentation, see **[Docs/CLI_USAGE.md](Docs/CLI_USAGE.md)**.

---

### 4. Headless HTTP API

Start the headless server:

```bash
pnpm --filter @semantiq/semantiq start
# Server listening at http://localhost:3000
```

Interact with core endpoints:

```bash
# Health & readiness
curl http://localhost:3000/health

# Catalog discovery
curl http://localhost:3000/api/v1/patterns

# Controlled language validation
curl -X POST http://localhost:3000/api/v1/claims/validate-language \
  -H "Content-Type: application/json" \
  -d '{"statement": "DP-008 observer is associated with reduced context drift."}'

# Draft governed claim
curl -X POST http://localhost:3000/api/v1/claims/draft \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "drift_mitigation",
    "targetPatternOrRelationId": "rel_08",
    "statement": "DP-008 observer is associated with reduced context drift.",
    "version": "1.0.0",
    "runIds": ["run_1", "run_2"]
  }'
```

The claim object's `version` above is its contract/schema version, not the
SemantIQ software release version.

For complete API documentation, see **[Docs/HTTP_API_REFERENCE.md](Docs/HTTP_API_REFERENCE.md)**.

---

## Canonical 18-Stage Research Reference Workflow

SemantIQ provides a verified reference implementation (`DP-008 → FP-002`) executing all 18 vertical stages from raw logs to cross-organization replication:

```
Controlled Run Fixtures
  └── 1. Canonical Adapter (raw logs → Run / Trace)
        └── 2. Trace Events (SHA-256 Merkle chain)
              └── 3. Behavioral Metrics
                    └── 4. Failure Evidence Extraction (Observed FP-002)
                          └── 5. Evidence Graph (rel_08: DP-008 refutes FP-002)
                                └── 6. 7D Run Matching (Matcher)
                                      └── 7. Matched Contrast (Bootstrap CI & Sign Test)
                                            └── 8. Robustness Diagnostics (TVD & Negative Controls)
                                                  └── 9. Specification Curve Analysis
                                                        └── 10. Evidence Decision Policy (Promote)
                                                              └── 11. Governed Claim Proposal (Language Check)
                                                                    └── 12. Peer Review (2 Independent Approvals)
                                                                          └── 13. Release Gate (Active Status)
                                                                                └── 14. Reproducible Research Bundle (Merkle Root)
                                                                                      └── 15. Partner Study Registration
                                                                                            └── 16. Protocol Pre-registration (Frozen Hash)
                                                                                                  └── 17. Execution Manifest Ingestion
                                                                                                        └── 18. Eligibility Gate & Replication
```

For a detailed step-by-step walkthrough, see **[Docs/RESEARCH_WORKFLOW.md](Docs/RESEARCH_WORKFLOW.md)**.

---

## Quick Start (Developer Setup)

```bash
# 1. Clone repository
git clone https://github.com/Logorythmus-org/Semantiq.git
cd Semantiq

# 2. Install dependencies & build
pnpm install
pnpm build

# 3. Run full verification suite
pnpm verify
```

---

## Documentation Platform

- 📐 **[System Architecture](Docs/ARCHITECTURE.md)**: Deep dive into Benchmark Engine, Evidence Engine, and Research Workbench.
- 🔬 **[Canonical Research Workflow](Docs/RESEARCH_WORKFLOW.md)**: 18-stage reference pipeline walkthrough.
- 🐍 **[Python Usage Guide](Docs/PYTHON_USAGE.md)**: `semantiq` Python SDK guide.
- 📘 **[TypeScript SDK Guide](Docs/TYPESCRIPT_SDK.md)**: `@semantiq/sdk` TypeScript guide.
- 💻 **[CLI Usage Guide](Docs/CLI_USAGE.md)**: Command-line reference.
- 🌐 **[Headless HTTP API Reference](Docs/HTTP_API_REFERENCE.md)**: REST API endpoint reference.
- 🛡️ **[Scientific Guardrails & Epistemic Invariants](Docs/SCIENTIFIC_GUARDRAILS.md)**: Formal guardrails specification.
- 📚 **[Documentation Index](Docs/DOCUMENTATION_INDEX.md)**: Master documentation index.
- 🤝 **[Contributing](CONTRIBUTING.md)**: Choose the fast path for bounded work or the rigorous core-change path for semantic, scientific, security, and governance changes.

---

## License & Attribution

- **Software**: [MIT License](LICENSE)
- **Documentation**: [Creative Commons Attribution 4.0 International (CC-BY-4.0)](Docs/LICENSING_REPORT.md)
- **Metadata**: [CITATION.cff](CITATION.cff), [codemeta.json](codemeta.json)
