# Quick Start Guide

Welcome to **SemantIQ**, Behavioral Evidence Infrastructure for AI Systems.

This guide walks you through setting up SemantIQ and running your first evidence workflows using the CLI, TypeScript SDK, and Python API.

---

## 1. Setup & Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Logorythmus-org/Semantiq.git
cd Semantiq
pnpm install
pnpm build
```

Verify your environment with the doctor tool:
```bash
pnpm doctor
```

---

## 2. Fast CLI Workflow

Validate claim statements and discover registered failure modes:

```bash
# Validate claim statement phrasing
node tools/automation/cli.mjs claims validate "DP-008 is associated with reduced FP-002 context drift."

# Inspect pattern catalog
node tools/automation/cli.mjs patterns list

# Inspect evidence graph
node tools/automation/cli.mjs evidence graph
```

---

## 3. TypeScript SDK Quick Start

```typescript
import { SemantiqClient } from "@semantiq/sdk";

const client = new SemantiqClient({ isOfflineDeterministic: true });

// Validate language
const validation = client.validateClaimLanguage(
  "DP-008 out-of-band observer is associated with reduced FP-002 drift."
);
console.log("Valid Language:", validation.isValid);

// Propose governed claim
const claim = client.draftClaim({
  topic: "anti_gaming_drift_mitigation",
  targetPatternOrRelationId: "rel_08",
  statement: "DP-008 out-of-band observer is associated with reduced FP-002 drift.",
  version: "1.0.0",
  runIds: ["run_1", "run_2"]
});
console.log("Drafted Claim ID:", claim.id);
```

---

## 4. Python API Quick Start

```python
from semantiq import SemantiqClient, validate_claim_language

# Validate language
validation = validate_claim_language(
    "DP-008 out-of-band observer is associated with reduced FP-002 drift."
)
print("Valid Language:", validation["is_valid"])

# Propose claim
client = SemantiqClient(is_offline_deterministic=True)
claim = client.draft_claim(
    topic="anti_gaming_drift_mitigation",
    target_pattern_id="rel_08",
    statement=validation["sanitized_statement"],
    run_ids=["run_1", "run_2"],
)
print("Drafted Claim ID:", claim.id)
```

---

## 5. Starting the Headless HTTP API Server

```bash
node packages/semantiq/dist/cli/index.js serve --port 3000
```

Verify server status:
```bash
curl http://localhost:3000/health
```
