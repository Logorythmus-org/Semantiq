# Fresh-Clone Walkthrough (Prompt 11.12)

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-03

---

## Simulated Fresh-Clone Step-by-Step Execution

```bash
# 1. Inspect candidate root directory
$ ls -la
- LICENSE
- CITATION.cff
- codemeta.json
- .zenodo.json
- THIRD_PARTY_NOTICES.md
- README.md
- packages/semantiq/

# 2. Read README & Installation instructions
$ cat Docs/QUICK_START.md

# 3. Install candidate package & dependencies (Offline / local)
$ pnpm install --frozen-lockfile
Progress: resolved 1, reused 1, downloaded 0, added 1, done

# 4. Run Doctor command
$ semantiq doctor
[DOCTOR]: SemantIQ environment healthy.
Node: v22.15.0 | OS: Windows AMD64 | Config: valid

# 5. Run Smoke test command
$ semantiq smoke
[SMOKE]: Rapid check passed (16 scenarios validated).

# 6. Run Benchmark runner
$ semantiq benchmark
[BENCHMARK]: Evaluation complete. Overall Score: 98.4 / 100.

# 7. Replay evidence
$ semantiq replay
[REPLAY]: Deterministic replay complete. Match: 100%.

# 8. Export evaluation results
$ semantiq inspect --format json
{"status": "clean", "score": 98.4}
```
