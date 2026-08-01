# Verb & Risk Class Separation Architecture

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Risk Separation Principle

Semantic classification (what action was taken) is strictly decoupled from environmental risk evaluation (what harm could occur):
- `defaultRiskClass` provides baseline static risk (`none`, `low`, `medium`, `high`, `critical`).
- `ConsequenceRecord` evaluates dynamic runtime risk based on actual environmental state changes and permission scopes.
