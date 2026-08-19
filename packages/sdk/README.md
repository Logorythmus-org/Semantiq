# SemantIQ TypeScript SDK (`@semantiq/sdk`)

> Standalone, typed TypeScript SDK for SemantIQ Behavioral Evidence Infrastructure, Governed Claims, and Reproducibility Verification.

[![Version](https://img.shields.io/badge/version-0.1.0--alpha.2-blue.svg)](https://npmjs.com/package/@semantiq/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Schema Version](https://img.shields.io/badge/Schema-v1.0.0-orange.svg)](https://github.com/Semant-iq/Semantiq)

---

## 🚀 Overview

`@semantiq/sdk` is the official, standalone TypeScript client for the SemantIQ behavioral evidence platform.
It is built with **zero Web UI or React dependencies** so that it can be seamlessly consumed by:

- Node.js backend services and microservices
- Web applications (Next.js, Vite, React, Vue, Svelte)
- Desktop applications (Electron, Tauri)
- CLI utilities and automation pipelines
- Cross-platform bridges (Flutter / React Native backend bridges)

---

## 📦 Installation

```bash
pnpm add @semantiq/sdk
# or
npm install @semantiq/sdk
# or
yarn add @semantiq/sdk
```

---

## 🛠️ Usage Examples

### 1. Offline Deterministic Benchmark Evaluation

```typescript
import {
  SemantiqClient,
  mockSystemProfile,
  mockBenchmark,
  mockCase,
  ProductRunStatus,
  EvaluationStatus
} from "@semantiq/sdk";

const client = new SemantiqClient({ isOfflineDeterministic: true });

const profile = mockSystemProfile({
  id: "sys_agent_01",
  name: "Production Financial Planner Agent"
});
const benchmark = mockBenchmark({ id: "bmk_anti_gaming_v1" });
const scenarioCase = mockCase({
  id: "case_sql_injection_01",
  benchmarkId: benchmark.id
});

const result = await client.evaluate({
  systemProfile: profile,
  benchmark,
  scenarioCase
});

console.log(`Run ID:            ${result.run.id}`);
console.log(`Evaluation Status: ${result.evaluation.status}`);
console.log(`Overall Score:     ${result.evaluation.overallScore}`);
console.log(`Review Verdict:    ${result.review.verdict}`);
```

### 2. Governed Claims & Controlled Language Validation

```typescript
import { SemantiqClient } from "@semantiq/sdk";

const client = new SemantiqClient();

// Validate statements against controlled language rules
const validation = client.validateClaimLanguage("Dynamic heartbeat causes zero downtime.");
console.log("Is Valid:", validation.isValid); // false - 'causes' is prohibited

// Draft a compliant governed claim
const claim = client.draftClaim({
  statement: "Dynamic heartbeat is associated with an 80% decrease in task timeouts.",
  topic: "heartbeat_resilience",
  targetPatternOrRelationId: "DP-001_FP-001",
  runIds: [result.run.id],
  observationIds: [result.observations[0].id]
});
console.log(`Draft Claim ID: ${claim.id} (Status: ${claim.status})`);
```

### 3. Matched Controls & Statistical Contrast

```typescript
import { SemantiqClient, mockRunProfile } from "@semantiq/sdk";

const client = new SemantiqClient();

const treatmentRuns = Array.from({ length: 5 }, (_, i) =>
  mockRunProfile({ runId: `treat_${i}`, isTreatment: true, score: 0.92 })
);
const controlRuns = Array.from({ length: 5 }, (_, i) =>
  mockRunProfile({ runId: `ctrl_${i}`, isTreatment: false, score: 0.65 })
);

const matchedData = client.matchControls({
  treatmentRuns,
  controlRuns,
  targetMetric: "score"
});

const report = client.evaluateContrast({
  targetMetric: "score",
  matchedData
});

console.log(`Mean Delta:     +${report.meanDelta}`);
console.log(`Bootstrap CI:   [${report.bootstrapCi.lower}, ${report.bootstrapCi.upper}]`);
console.log(`Evidence Grade: ${report.statisticalEvidenceGrade}`);
```

### 4. Cryptographic Research Bundle Export & Verification

```typescript
import { SemantiqClient, mockGovernedClaim } from "@semantiq/sdk";

const client = new SemantiqClient();
const claim = mockGovernedClaim();

const bundle = client.exportResearchBundle({
  bundleId: "bundle_2026_q3",
  title: "Empirical Evidence Bundle",
  runs: [result.run],
  evaluations: [result.evaluation],
  claims: [claim]
});

const isValid = client.verifyBundle(bundle);
console.log(`Bundle Verified: ${isValid} (Root: ${bundle.merkleRootHash})`);
```

---

## 🔒 Epistemic Invariants

- **Observed $\neq$ Inferred**: Telemetry-grounded observations require recorded trace events.
- **Matched Association $\neq$ Causal Effect**: Disclaimers are embedded on all statistical contrast reports.
- **Controlled Language**: Unhedged causal verbs are blocked at the SDK validation gate.
- **Deterministic Integrity**: Cryptographic Merkle roots and SHA-256 signatures seal exported artifact bundles.

---

## 📄 License

MIT License. Copyright © 2026 Logorythmus / SemantIQ Research Consortium.
