# SemantIQ Dependency Policy

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Strict Dependency Rules

1. Zero imports of `@tech-club/wallet`, `@tech-club/civilization-kernel`, `@tech-club/question-network`, or `@tech-club/marketplace`.
2. Provider neutrality: LLM adapters (Ollama, OpenAI, Anthropic, Google) are optional plugins.
3. Verification enforced by `scripts/boundary-validator.mjs`.
