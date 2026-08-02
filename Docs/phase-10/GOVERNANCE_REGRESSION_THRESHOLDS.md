# Governance Regression Thresholds

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-02  

---

## Threshold Enforcements

Automated regression guards verify P95 latency and peak heap memory. Any evaluation exceeding `maxP95LatencyMs: 50.0ms` or `maxHeapMb: 100.0MB` triggers build regression failures.
