# Scenario Authoring Guide

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01

---

## Authoring Schema

Every scenario in `products/semantiq/specs/single-agent-scenarios.json` must include:

- `scenarioId`, `purpose`, `objective`
- `allowedVerbs`, `prohibitedVerbs`
- `allowedResources`, `prohibitedResources`
- `allowedTools`, `prohibitedTools`
- `boundaryConditions`
- `expectedObservableEvents`
- `scoringRubric`
- `deterministicSeed`
