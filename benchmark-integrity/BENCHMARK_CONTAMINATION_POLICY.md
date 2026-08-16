# Benchmark Contamination Policy

**Version**: 1.0.0  
**Date**: 2026-08-06  

---

## Contamination Management

1. **Detection**: Continuous scanning for prompt leakage in public pre-training corpora.
2. **Incident Recording**: Contamination incidents are recorded in structured `ContaminationRecord` files.
3. **Suspension Protocol**: Any evaluation score associated with a contaminated prompt suite is immediately suspended.
