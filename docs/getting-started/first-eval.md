# Running Your First Evaluation

SemantIQ evaluates observable model behavior using deterministic rubrics and verifiable evidence traces.

## 1. Execute the Baseline Benchmark Scenario

```bash
pnpm smoke
```

Expected output:

```
Executing canonical local smoke test...
[PASS] Local smoke evaluation completed successfully.
Report ID: benchmark_report_...
Weighted Score: 0.10
```

## 2. Inspecting the Evidence Receipt

SemantIQ produces a cryptographic evidence receipt with SHA-256 Merkle trace chaining:

- **Report ID**: Unique evaluation identifier
- **Execution Receipt**: Timestamped log of observed behavioral transitions
- **Score Breakdown**: Multi-dimensional rubrics with explicit reasoning weights
