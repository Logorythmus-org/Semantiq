# Mapping Confidence Specification

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-02

---

## Confidence Score Rules

Every evidence mapping MUST assign a numerical `MappingConfidence` score between `0.0` (purely speculative) and `1.0` (direct cryptographic evidence match). Scores below `0.2` trigger `unsupported_mapping`.
