# Public Ecosystem Claim Status

This document aligns active ecosystem wording with repository evidence at protected-main revision
`9095c3db2309b93f9fe76496c8f22397f211b30a`. The canonical decisions and evidence paths are in
[`public-claim-matrix.json`](public-claim-matrix.json); implementation relationships remain defined
by the [Integration Graph](INTEGRATION_GRAPH.md).

## Vocabulary

| Term | Public meaning |
|---|---|
| Implemented | Working code with meaningful repository tests |
| Implemented — partial validation | Working code with a material real-runtime, conformance, or external-evidence gap |
| Contract available | Interface or schema exists without operational integration evidence |
| Simulated | Repository behavior intentionally models, rather than calls, the external system |
| Planned / documented target | Documentation or configuration exists without a verified runtime connector |
| Unverified compatibility | The repository has not demonstrated compatibility against the named system |
| Unpublished | Local package/export capability exists without registry or platform publication evidence |
| Historical / migration-bound | Preserved identity or record that is not a current integration claim |

## Active truth surface

- OpenAI, Anthropic, Google GenAI, and Ollama are documented/configuration targets, not verified
  runtime connectors.
- E2B execution is simulated. OpenSandbox is a partially validated HTTP protocol client; official
  upstream compatibility is not established.
- Docker Engine execution is implemented with partial live-daemon validation. Podman compatibility
  is unverified.
- Linux is exercised in required CI. Windows is best-effort and macOS is unverified by required CI.
- The generic benchmark-pack mapper is implemented with partial validation. MMLU, GSM8K, HELM, and
  Big-Bench are not established as format-compatible or successfully executed upstream benchmarks.
- License and provenance values are supplied metadata, not legal, ownership, redistribution-rights,
  or independent provenance verification.
- Hugging Face and Kaggle exporters produce local artifacts; official-tool validation,
  authenticated upload, namespace ownership, and publication are not established.
- npm and PyPI packages are unpublished. Zenodo deposition/DOIs and GitHub Pages deployment are not
  established.
- A replication submission remains distinct from verified external replication.

## Historical boundary

Datestamped phase, publication-verification, governance, and preservation reports remain historical
records and were not mass-rewritten. Their past wording is not the active support matrix. Legacy
`tech-club`, `techclub`, `@tech-club/*`, and `techclub/*` identifiers remain migration-bound until a
separate human-authorized namespace migration.
