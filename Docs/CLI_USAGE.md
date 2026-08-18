# SemantIQ Command-Line Interface (CLI) Guide

## Overview

The `semantiq` CLI provides a unified interface for system diagnostics, benchmark execution, pattern discovery, governed claims, and headless server hosting.

---

## Global Options

```bash
semantiq [command] [options]

Options:
  -v, --version          Display SemantIQ version
  -h, --help             Display help documentation
  --json                 Output result in JSON format
```

---

## Commands Reference

### 1. Diagnostics (`doctor`)

Run environment checks, workspace sanity, and configuration diagnostics:

```bash
semantiq doctor
```

---

### 2. Pattern Catalog (`patterns`)

List and inspect discovered design patterns and failure modes:

```bash
# List all registered patterns
semantiq patterns list

# Inspect specific pattern details
semantiq patterns get DP-008
```

---

### 3. Evidence Graph (`evidence`)

Inspect empirical relationships and evidence graphs:

```bash
# Inspect graph relationships
semantiq evidence graph

# Query empirical observations for a relation
semantiq evidence observations --relation rel_08
```

---

### 4. Governed Claims (`claims`)

Validate language, propose claims, and inspect registry records:

```bash
# Validate statement phrasing against controlled language rules
semantiq claims validate "DP-008 is associated with reduced drift."

# Draft a new governed claim
semantiq claims draft \
  --topic "anti_gaming_drift_mitigation" \
  --relation "rel_08" \
  --statement "DP-008 is associated with reduced FP-002 drift." \
  --runs "run_1,run_2"

# Inspect claim by ID
semantiq claims get claim_001
```

---

### 5. Peer Reviews (`reviews`)

Manage two-party review queues and approvals:

```bash
# Enqueue claim for peer review
semantiq reviews enqueue --claim-id claim_001

# Submit review decision
semantiq reviews submit \
  --claim-id claim_001 \
  --reviewer "reviewer_01" \
  --decision "approve" \
  --comments "Benchmark results adhere to protocol."
```

---

### 6. Study Protocols (`studies`)

Generate and freeze study protocols:

```bash
# Generate study protocol for relation
semantiq studies generate --relation rel_08

# Freeze protocol and obtain pre-registration fingerprint
semantiq studies freeze --protocol proto_001
```

---

### 7. Reproducible Bundles (`bundles`)

Build and verify research bundles:

```bash
# Build research bundle
semantiq bundles build --study-id study_001 --claims claim_001

# Verify bundle cryptographic integrity
semantiq bundles verify --bundle-path ./bundle.tar.gz
```

---

### 8. Headless HTTP Server (`serve`)

Start the UI-independent HTTP API server:

```bash
# Start server on default port (3000)
semantiq serve

# Start server on custom port
semantiq serve --port 8080
```
