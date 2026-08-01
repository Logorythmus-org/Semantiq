# Verb Alias Resolution Policy

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Alias Policy Rules

1. **Deterministic Mapping**: Aliases (e.g. `run_command` -> `execute`, `read_file` -> `read`) map strictly to single canonical verbs.
2. **Ambiguous Alias Rejection**: Prohibited ambiguous terms (e.g. `do`, `make`, `change`, `think`) are rejected to prevent uncalibrated risk scoring.
3. **Unknown Verb Policy**: Unknown verbs return `undefined` and trigger explicit validator errors.
