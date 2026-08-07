# Phase 12 Rollback Triggers and Immediate Freezing Policy

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-07  

---

## Active Rollback & Freeze Triggers

The following events trigger an immediate emergency freeze or rollback of the Public Alpha release candidate:

1. **Credential or Secret Leak**: Any API key, token, or private key discovered in candidate artifacts.
2. **Unhandled Prompt Injection**: Any unhandled evaluator bypass or score manipulation exploit.
3. **Breach of Human Responsibility**: Any public deployment attempting to use SemantIQ as a sole automated decision-maker in employment, legal, credit, medical, or life-impacting scenarios.
4. **Protected Content Leakage**: Any exposure of Tier D protected benchmark challenges in public distributions.
5. **Scientific Boundary Failure**: Any unsupported claim presenting benchmark scores as certifications of intelligence or general safety.
