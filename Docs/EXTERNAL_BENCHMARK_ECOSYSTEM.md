# External Benchmark Ecosystem Architecture Guide

This document details the third-party **External Benchmark Ecosystem Architecture** for **SemantIQ Benchmarks**.

---

## 1. Third-Party Benchmark Support

SemantIQ supports importing external benchmark formats (MMLU, GSM8K, HELM, Big-Bench) via `importExternalBenchmark()` and registering custom packs in `examples/ecosystem/benchmark-registry.json`.

---

## 2. Benchmark Pack Validation

Every external benchmark pack is verified using `validateExternalBenchmarkPack()` to ensure schema compliance and open data licensing (**CC0-1.0** / **MIT**).
