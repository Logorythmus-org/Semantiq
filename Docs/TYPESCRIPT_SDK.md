# TypeScript SDK Usage Guide (`@semantiq/sdk`)

## Overview

The `@semantiq/sdk` package provides first-class, type-safe TypeScript bindings for SemantIQ Behavioral Evidence Infrastructure.

---

## Installation

The provisional `0.1.0-alpha.2` Public Alpha package is not published on npm. Use the
SDK from the checked-out pnpm workspace:

```bash
pnpm install --frozen-lockfile
pnpm test:sdk
```

---

## Usage Examples

### 1. Initialize Client

```typescript
import { SemantiqClient } from "@semantiq/sdk";

// Initialize with offline deterministic mode or HTTP endpoint
const client = new SemantiqClient({
  endpoint: "http://localhost:3000", // optional HTTP API baseUrl
  isOfflineDeterministic: true
});
```

---

### 2. Controlled Language Validation

```typescript
const validation = client.validateClaimLanguage(
  "DP-008 out-of-band observer is associated with a 0.25 observed increase in goal retention."
);

if (!validation.isValid) {
  console.error("Violations:", validation.violations);
} else {
  console.log("Sanitized Statement:", validation.sanitizedStatement);
}
```

---

### 3. Matched Controls & Statistical Contrast

```typescript
import type { RunProfile } from "@semantiq/sdk";

const treatmentRuns: RunProfile[] = [
  {
    runId: "run_treat_01",
    isTreatment: true,
    environment: { platform: "linux", provider: "docker", networkIsolated: true, os: "linux-x86_64" },
    model: { modelFamily: "gpt-4", modelId: "gpt-4-0613", temperature: 0.0 },
    population: { topology: "single", agentCount: 1 },
    tools: { toolCount: 5, hasBoundaryGuard: true, allowedToolNames: ["host_pty_observer"] },
    memory: { contextWindowTokens: 8192, hasMemoryPartitioning: true },
    resourcePressure: { maxSteps: 20, tokenBudget: 50000 },
    horizon: "long",
    outcomeMetrics: { goal_retention_score: 0.95 }
  }
];

const controlRuns: RunProfile[] = [
  {
    runId: "run_ctrl_01",
    isTreatment: false,
    environment: { platform: "linux", provider: "docker", networkIsolated: true, os: "linux-x86_64" },
    model: { modelFamily: "gpt-4", modelId: "gpt-4-0613", temperature: 0.0 },
    population: { topology: "single", agentCount: 1 },
    tools: { toolCount: 5, hasBoundaryGuard: true, allowedToolNames: ["unmonitored_shell"] },
    memory: { contextWindowTokens: 8192, hasMemoryPartitioning: true },
    resourcePressure: { maxSteps: 20, tokenBudget: 50000 },
    horizon: "long",
    outcomeMetrics: { goal_retention_score: 0.70 }
  }
];

// Match controls
const matchedData = client.matchControls({
  treatmentRuns,
  controlRuns,
  targetMetric: "goal_retention_score"
});

// Evaluate contrast
const contrastReport = client.evaluateContrast({
  targetMetric: "goal_retention_score",
  matchedData
});

console.log(`Matched Pairs: ${matchedData.matchedPairs.length}`);
console.log(`Mean Delta: ${contrastReport.meanDelta}`);
console.log(`Bootstrap CI: [${contrastReport.bootstrapCi.lower}, ${contrastReport.bootstrapCi.upper}]`);
```

---

### 4. Governed Claim Proposal

```typescript
const claim = client.draftClaim({
  topic: "anti_gaming_drift_mitigation",
  targetPatternOrRelationId: "rel_08",
  statement: "DP-008 out-of-band observer is associated with reduced FP-002 context drift.",
  version: "1.0.0",
  runIds: ["run_treat_01", "run_ctrl_01"]
});

console.log(`Drafted Claim: ${claim.id} (Status: ${claim.status})`);
```
