# Multi-Agent Scenario Authoring Guide

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01

---

## Authoring Guidelines

Every scenario added to `products/semantiq/specs/multi-agent-scenarios.json` MUST contain:

- Explicit agent rosters, roles, capabilities, and authorities.
- Deterministic seed for PRNG initialization.
- Isolated local file paths (`/tmp/scratch/`).
- Verifiable success/failure conditions and responsibility expectations.
