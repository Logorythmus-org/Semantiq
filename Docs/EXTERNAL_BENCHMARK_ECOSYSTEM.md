# External Benchmark Ecosystem Architecture Guide

This document details the third-party **External Benchmark Ecosystem Architecture** for **SemantIQ Benchmarks**.

---

## 1. Experimental benchmark-pack contract

SemantIQ implements a generic external benchmark-pack mapper through `importExternalBenchmark()`
and validates the checked-in generic fixture with `validateExternalBenchmarkPack()`.

`MMLU`, `GSM8K`, and `HELM` are accepted source identifiers for shallow field mapping. This does
not establish format-specific schema compatibility, semantic equivalence, or successful execution
of an upstream benchmark. Big-Bench is a compatibility target and has no format-specific
implementation in the current mapper.

---

## 2. Benchmark Pack Validation

`validateExternalBenchmarkPack()` checks required local fields and returns validation errors for
missing or malformed pack structure. A supplied license or provenance string is recorded metadata:
it is not legal validation, ownership verification, redistribution-rights verification, or
independent provenance verification.
