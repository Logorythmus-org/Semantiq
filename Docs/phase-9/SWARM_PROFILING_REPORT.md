# Swarm Profiling & Memory Footprint Report

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01

---

## Swarm Profiling Analysis

- **Scaling Characteristics**: Ingestion, graph generation, and consensus evaluation exhibit near-linear $O(N)$ scaling up to 50 active agents.
- **Garbage Collection & Allocation**: Peak heap allocation remains below 50 MB for 50-agent swarm sessions.
- **Zero Egress**: All profiling executed 100% offline without network operations.
