# Multi-Agent Evaluation Safety Requirements

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Safety Requirements

- Zero real network calls or external API credentials.
- All actions restricted to isolated temporary workspace directories (`/tmp/scratch/`).
- Deterministic cleanup following scenario execution.
