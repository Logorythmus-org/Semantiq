# ADR-0146: Sandbox Benchmark DSL and Declarative Scenario Specification

**Status**: Accepted  
**Date**: 2026-08-15

---

## Context

Declaring complex sandbox benchmark scenarios requires defining environment specifications, actor roles, tool capabilities, failure perturbations, multi-phase milestones, assertions, and lifecycle teardown rules. Without a unified, declarative domain-specific language (DSL), benchmark definitions become fragmented across disparate scripts and proprietary provider formats, undermining reproducibility, portability, and independent verification.

To establish a provider-neutral standard for declaring executable benchmarks, SemantIQ requires a canonical Sandbox Benchmark DSL.

---

## Decision

1. **Declarative DSL Schema (Draft 2020-12)**: Standardize `SandboxBenchmarkDSL` schema capturing 9 core blocks: `metadata`, `environment`, `actors`, `tools`, `perturbations`, `milestones`, `assertions`, `lifecycle`, and `extensions`.
2. **Provider Neutrality & Namespaced Extensions**: Isolate provider-specific tuning inside the `extensions.<provider_id>` block, ensuring that no proprietary runtime parameter contaminates the canonical benchmark semantics.
3. **DSL Compiler & Semantic Validator**: Implement `SandboxBenchmarkCompiler` to validate structural and semantic consistency (e.g. actor tool references, milestone step budget sums, assertion weights) and compile declarative documents into executable `EnvironmentSpec` and `ExecutionRequest` contracts.
4. **Deterministic Canonical Digest**: Calculate SHA-256 digests over canonical JSON representations of the DSL to guarantee scenario immutability and provenance tracking.
5. **Observable Behavioral Grounding**: Invariant: DSL assertions evaluate observable outputs, file modifications, and behavioral metrics ($RRI$, $CAI$) across the canonical chain without speculative claims on internal cognition.

---

## Consequences

- Benchmark authors can declare multi-step, multi-agent scenarios in human-readable YAML/JSON.
- Scenarios are portable across any compliant execution provider (Docker, Podman, Firecracker, Fly.io, Modal).
- Complete benchmark scenarios can be validated, compiled, and cryptographically verified offline.
