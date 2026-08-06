# Evaluator Awareness Tests

**Version**: 1.0.0  
**Date**: 2026-08-06  

---

## Isolation and Hardening Rules

1. Model output is sanitized before passing to evaluation prompts.
2. System instructions inside evaluator contexts are immutable.
3. Automated test fixtures inject simulated prompt injection attacks to verify evaluator robustness.
