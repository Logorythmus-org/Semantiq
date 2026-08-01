# Behavioral Contracts Specification

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## TypeScript Contract Architecture

All domain contracts are defined in `packages/semantiq/src/behavioral-contracts.ts` and re-exported through `packages/semantiq/src/index.ts`.

### Design Principles
1. **Immutable Identifiers**: Unique string IDs (`id`).
2. **Explicit ISO Timestamps**: UTC timestamp strings.
3. **Evidence References**: External hashes & URIs instead of blob payloads.
4. **Provider Neutrality**: Zero provider-specific fields.
5. **No Private CoT**: Chain-of-thought is not recorded or stored.
