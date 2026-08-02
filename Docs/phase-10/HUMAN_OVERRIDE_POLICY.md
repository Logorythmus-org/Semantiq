# Human Override Policy Specification

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-02  

---

## Override Policy Rules

Human supervisors may issue state interventions or policy overrides (`overrideJustification`). Every override MUST record a non-empty `overrideJustification` string. Unjustified overrides trigger `human_override_without_justification`.
