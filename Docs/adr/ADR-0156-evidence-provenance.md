# ADR-0156: SemantIQ End-to-End Evidence Provenance and Lineage Graph Architecture

**Status**: Accepted  
**Date**: 2026-08-15

---

## Context

In complex AI evaluations spanning multiple models, intermediate data transformations, external sandbox execution providers, generated artifacts, and scoring rubrics, benchmark auditors must be able to trace backwards from any evaluation metric or pass/fail verdict to the exact model checkpoint, container digest, raw observation bytes, and transformation history.

---

## Decision

1. **Six-Layer Lineage Graph**:
   - `BenchmarkManifestLineage`: Scenario ID, DSL version, manifest SHA-256 digest, git commit.
   - `ModelAgentLineage`: Model ID, version, architecture, prompt digest, temperature.
   - `EnvironmentProviderLineage`: Provider ID, provider version, image digest, host platform, kernel.
   - `TransformationRecord`: Sequential input/output digest tracking for log/diff sanitization.
   - `ArtifactProvenanceRecord`: File paths, sizes, step origins, and SHA-256 hashes.
   - `EvaluatorLineageRecord`: Evaluator ID, version, rubric digest, and execution timestamp.
2. **Graph Merkle Root & Cryptographic Signing**:
   - All 6 lineage dimensions are hashed and combined into `graphMerkleRoot`, signed by the evaluator with `lineageSignatureHex`.
3. **Evidence Provenance Engine**:
   - Implement `EvidenceProvenanceEngine` providing `constructGraph`, `verifyContinuity`, and `formatProvenanceMarkdown`.
4. **Observable Behavioral Grounding**: Invariant: The Provenance Graph binds physical observable trace digests, artifact hashes, and environment specifications without asserting claims about internal model cognition.

---

## Consequences

- Full, tamper-proof audit trail for every benchmark score and artifact.
- Eliminates "black-box" evaluation ambiguity.
- Seamlessly exported in portable Evidence Packages and verifiable Execution Receipts.
