# SemantIQ Benchmarks

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version: 0.1.0-alpha.2](https://img.shields.io/badge/Version-0.1.0--alpha.2-green.svg)](CHANGELOG.md)
[![Product Status: Public Alpha](https://img.shields.io/badge/Product%20Status-Public%20Alpha-brightgreen.svg)](docs/project/release-notes.md)
[![Documentation](https://img.shields.io/badge/Docs-Passing-brightgreen.svg)](docs/README.md)

---

## Canonical Direction & Architecture

```
Observation before judgment. Evidence before score. Evidence before release claim.
```

1. **Observable Behavioral Grounding**:
   $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$
2. **Provider-Neutral Benchmark Pipeline**:
   $$\text{Benchmark / Scenario} \longrightarrow \text{Connector / SPIS Contract} \longrightarrow \text{Optional External Execution} \longrightarrow \text{Observation} \longrightarrow \text{Canonical Evidence} \longrightarrow \text{Evaluation} \longrightarrow \text{Report}$$

SemantIQ is **not** a sandbox runtime vendor. SemantIQ defines the evaluation protocol and connects to replaceable execution providers. OpenSandbox, local Docker/Podman, MicroVMs, and cloud environments remain optional and replaceable.

---

## Feature Readiness Classification (v0.1.0-alpha.2)

| Readiness Tier      | Scope & Capabilities                                                                                                                                                                                                                                                                                                                                                                                  |        Stability Guarantee         |
| :------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------: |
| **WORKS TODAY**     | • CLI Runner (`run`, `replay`, `validate`, `report`)<br>• Local offline deterministic execution (Mock & OCI)<br>• Canonical evidence normalization & Merkle trace sealing<br>• 7-stage behavioral evaluation (`Context → Recovery`)<br>• Anti-gaming heuristics & independent observer mirroring<br>• Draft 2020-12 schema validation suite (37 schemas)<br>• Credential redaction & secret scrubbing |    **FROZEN (Alpha Baseline)**     |
| **EXPERIMENTAL**    | • Long-horizon multi-step trajectory evaluation<br>• Multi-agent sandbox coordination & arbitration<br>• Transition state recovery laboratory (`TransitionLab`)<br>• Provider Variance Sensitivity ($PVS$) scoring                                                                                                                                                                                    |    **PREVIEW (API may evolve)**    |
| **OPTIONAL**        | • OpenSandbox daemon adapter (`@semantiq/adapter-opensandbox`)<br>• PostgreSQL persistent storage backend<br>• Remote cloud model providers (OpenAI, Anthropic, Google GenAI)                                                                                                                                                                                                                         | **MODULAR (Zero core dependency)** |
| **NOT IMPLEMENTED** | • Autonomous live web browsing proxy runtime<br>• Native GUI pixel-interaction executor<br>• Zero-knowledge cryptographic proof generation                                                                                                                                                                                                                                                            | **DEFERRED (Out of Alpha Scope)**  |
| **ROADMAP**         | • Distributed multi-node benchmark orchestration (v0.2.0)<br>• Real-time web visualization dashboard (v0.2.0)<br>• Multi-tenant enterprise SaaS gateway (v1.0.0)                                                                                                                                                                                                                                      |         **FUTURE ROADMAP**         |

---

## Key Principles (Evidence-Bounded)

- **Local-First Architecture**: Evaluates models on local hardware without mandatory cloud accounts or tracking telemetry.
- **Explainable Rubrics**: Evaluates multi-dimensional criteria (observable decision trace, semantic consistency, evidence grounding, recovery capability) with transparent score explanations.
- **Verifiable Evidence Provenance**: Cryptographic Merkle trace hash chaining, canonical JSON digests, and verifiable execution receipts.
- **Provider Neutral**: Connects to local Ollama endpoints or optional remote LLM APIs (OpenAI, Anthropic, Google GenAI) with pre-transmission consent warnings.
- **No Mandatory Infrastructure**: SemantIQ Core requires no mandatory SemantIQ-operated hosting infrastructure.
- **Scholarly Attribution**: DOI-ready publication workflows with DataCite metadata (`CITATION.cff`, `codemeta.json`, `.zenodo.json`).

---

## Mandatory Canonical Disclaimer

> _"This result describes observed behavior in the specified evaluation environment. It does not certify the system as safe, reliable, legally compliant, intelligent, or suitable for a specific deployment."_

---

## Start Here

- 📖 **[Documentation Index](docs/README.md)**: Full navigation for getting started, concepts, benchmarks, and API reference.
- 🚀 **[Quick Start Guide](docs/getting-started/index.md)**: 3-step verification flow (\`install → doctor → smoke\`).
- 💻 **[Installation Guide](docs/getting-started/installation.md)**: Platform dependencies, Node.js setup, and local environment.
- 🔒 **[Privacy & Offline Guide](docs/security/privacy.md)**: Local evaluation architecture and offline execution mode.
- 🌐 **[Model Connectors](docs/integrations/connectors.md)**: Setup for Ollama, OpenAI, Anthropic, and Google GenAI.
- 🔬 **[Reproducibility Walkthrough](docs/evidence/reproducibility.md)**: Step-by-step score reproduction and raw evidence verification.
- 📋 **[Limitations Register](docs/project/limitations.md)**: Transparent listing of known alpha boundaries and non-goals.

---

## Quick Start

```bash
# 1. Clone & Install
git clone https://github.com/Logorythmus-org/Semantiq.git
cd Semantiq
pnpm install

# 2. Run System Health Preflight & Diagnostics
pnpm semantiq doctor
pnpm preflight

# 3. Run Local Offline Evaluation Smoke Test
pnpm smoke

# 4. Reproduce & Export Benchmark Evidence
pnpm reproduce
pnpm export
```

---

## License & Attribution

- **Source Code**: [MIT License](LICENSE)
- **Documentation**: [Creative Commons Attribution 4.0 International (CC-BY-4.0)](docs/project/licensing.md)
- **Baseline Data**: [CC0-1.0 Universal Public Domain](examples/identifiers/benchmark-pack.json)

For citation metadata, see [CITATION.cff](CITATION.cff) or [docs/project/licensing.md](docs/project/licensing.md).
