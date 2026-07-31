# Benchmark Reproduction Walkthrough

This walkthrough demonstrates how to independently reproduce evaluation scores and verify score identity in **SemantIQ Benchmarks**.

---

## Reproduction Philosophy

Scientific evaluation requires **reproducibility**:
1. Every benchmark run records input content, scoring profile, weights, pipeline version, and environment metadata.
2. Given identical inputs, scoring profiles, and seeds, deterministic scoring produces identical score reports.
3. Raw execution evidence is stored separately from human interpretation and weighted score aggregation.

---

## Step-by-Step Reproduction Walkthrough

### Step 1: Run Benchmark Evaluation
Run evaluation on a benchmark pack:
```bash
node tools/automation/cli.mjs smoke --json > initial-run.json
```

### Step 2: Extract Report Fingerprint
Inspect the generated `weightedScore`, `scores`, and `stageResults` in `initial-run.json`.

### Step 3: Execute Reproduction Command
Re-run evaluation using the reproduction pipeline:
```bash
node tools/automation/cli.mjs reproduce --json > repro-run.json
```

### Step 4: Verify Score Identity
Compare score values between initial run and reproduced run. In deterministic mode, weighted scores and dimension scores will be 100% identical.

---

## Raw Evidence vs Scoring Rubrics

- **Raw Execution Evidence**: Contains exact model responses, response latency, token counts, and input parameters.
- **Scoring Rubric**: Contains dimension weights, scoring criteria, explanation strings, and improvement roadmap.

Both artifacts are preserved in JSON report exports for audit and scientific verification.
