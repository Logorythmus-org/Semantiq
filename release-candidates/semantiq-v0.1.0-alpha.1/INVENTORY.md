# SemantIQ Benchmarks — Candidate Inventory
# Version: 0.1.0-alpha.1
# Source Commit: 4c17ba326581aacdd2318ad3837fd2a2ed3ee4f4
# Generated: 2026-08-03T18:38:02Z
# Status: UNPUBLISHED — Phase 11 candidate only

## Included Files (Declared via extraction-manifest.json)

### Core Package — packages/semantiq/src/

| File | Description |
|------|-------------|
| `index.ts` | Main public export barrel |
| `scoring.ts` | Phase 8 scoring engine |
| `benchmark.ts` | Phase 8 benchmark runner |
| `domain.ts` | Core domain primitives |
| `policies.ts` | Phase 9 policy model |
| `governance-replay.ts` | Governance replay engine |
| `exception-model.ts` | Phase 10.4 exception model |
| `governance-scenarios.ts` | Phase 10.9 scenario engine |
| `source-inventory.ts` | Phase 11.1 source inventory |
| `manifest-validator.ts` | Phase 11.2 manifest validator |
| `dependency-graph.ts` | Phase 11.3 dependency graph |
| `runtime-dependency-remover.ts` | Phase 11.4 runtime dep remover |
| `cli.ts` | Phase 11.5 CLI engine |
| `data-layer.ts` | Phase 11.6 data layer |
| `test-harness.ts` | Phase 11.7 test harness |
| `documentation-extractor.ts` | Phase 11.8 doc extractor |
| `license-auditor.ts` | Phase 11.9 license auditor |
| `clean-room-generator.ts` | Phase 11.10 clean-room generator |

### Product Specs — products/semantiq/specs/

| File | Description |
|------|-------------|
| `verb-taxonomy.json` | Verb taxonomy dataset |
| `single-agent-scenarios.json` | Single-agent scenario pack |
| `multi-agent-scenarios.json` | Multi-agent scenario pack |
| `governance-scenarios.json` | Governance scenario pack |
| `package-graph.json` | Package graph spec |

### Root Metadata

| File | Description |
|------|-------------|
| `LICENSE` | MIT License |
| `CITATION.cff` | Academic citation metadata |
| `codemeta.json` | Software metadata (CodeMeta v2) |
| `.zenodo.json` | Zenodo deposit metadata |
| `THIRD_PARTY_NOTICES.md` | Third-party license notices |
| `products/semantiq/extraction-manifest.json` | Extraction manifest |

## Excluded Files

- `.git/` — Parent Git history — EXCLUDED
- All `packages/sprint*-runtime/` — Parent-only packages — EXCLUDED
- `packages/alpha-runtime/`, `packages/alpha-operations/` — Parent-only — EXCLUDED
- `packages/mvp-runtime/`, `packages/graph-runtime/` — Parent-only — EXCLUDED
- `packages/agent-runtime/`, `packages/research/` — Parent-only — EXCLUDED
- `apps/`, `services/` — Parent apps — EXCLUDED
- `Tech-Club-Architect-Blueprint.md` — Internal doc — EXCLUDED
- `canonical-release-audit.md` — Stale report — EXCLUDED
