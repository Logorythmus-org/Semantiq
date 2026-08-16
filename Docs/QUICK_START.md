# Quick Start Guide

Welcome to **SemantIQ Benchmarks**, an independent, open-source, local-first AI evaluation toolkit.

This guide takes you from a clean checkout to running local benchmark evaluations, inspecting raw evidence, exporting reports, and reproducing scores in under 5 minutes.

---

## User Personas & Scenarios

- **Developer**: Programmatic SDK evaluation (`@tech-club/semantiq`), CLI integration, unit tests.
- **Researcher**: Explainable scoring rubrics, offline raw benchmark evidence, reproducible exports.
- **Student**: Simple local execution without Docker or cloud accounts, step-by-step guidance.
- **Open-Source Contributor**: Clean monorepo structure, quality gates (`pnpm verify`), transparent contracts.
- **AI Product Team**: Model connectors (Ollama, OpenAI, Anthropic, Google GenAI), preflight, smoke testing.
- **Security-Conscious User**: Local-first posture, zero telemetry by default, `--safe-mode` enforcement.

---

## Canonical First-Run Flow

Follow these 9 verified steps:

```text
install → launch → connector → preflight → smoke test → benchmark → inspect evidence → export → reproduce
```

### Step 1: Install Dependencies

```bash
git clone https://github.com/tech-club/tech-club.git
cd tech-club
pnpm install
```

### Step 2: Run First-Run Doctor

Check node runtime compatibility, workspace integrity, and local configuration:

```bash
pnpm doctor
# or
node tools/automation/cli.mjs doctor
```

### Step 3: Inspect Model Connectors

By default, SemantIQ uses deterministic local evaluation. View available local & remote connectors:

```bash
node tools/automation/cli.mjs connector
```

### Step 4: Run Preflight Check

Validate system readiness and model connector posture:

```bash
node tools/automation/cli.mjs preflight
```

### Step 5: Execute Local Smoke Test

Run a fast local evaluation verifying score pipeline handling:

```bash
node tools/automation/cli.mjs smoke
```

### Step 6: Run Benchmark Evaluation

Run explainable evaluation against a benchmark target:

```bash
pnpm benchmark
```

### Step 7: Inspect Evidence

Review generated raw evidence and explanation outputs separate from summary scores in the generated reports.

### Step 8: Export Evaluation Reports

Export reports in JSON or Markdown format:

```bash
node tools/automation/cli.mjs export
```

### Step 9: Reproduce Results

Re-run evaluation manifests and verify identical score results:

```bash
node tools/automation/cli.mjs reproduce
```
