# SemantIQ Benchmarks (Local Development Workspace)

> **Development Notice**: This workspace contains the local development environment for **SemantIQ Benchmarks** alongside internal Tech Club monorepo platform modules.
> All development during **Phase 8, Phase 9, and Phase 10 is local-only**.
> Public release to GitHub occurs strictly via **Phase 11 (Clean-Room Extraction)** and **Phase 12 (Authorized Publication)** under `config/release-freeze.json` safeguards.

---

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version: 0.1.0-alpha.1](https://img.shields.io/badge/Version-0.1.0--alpha.1-green.svg)](CHANGELOG.md)
[![Status: Public Alpha](https://img.shields.io/badge/Status-Public%20Alpha-orange.svg)](Docs/GO_NO_GO_DECISION.md)

---

## Key Principles

- **Local-First & Private**: Evaluates models on your own hardware without mandatory cloud accounts or tracking telemetry.
- **Explainable Rubrics**: Evaluates multi-dimensional criteria (reasoning quality, semantic consistency, evidence grounding, scientific potential) with transparent score explanations.
- **Reproducible Science**: 100% score reproduction, deterministic execution manifests, and explicit separation of raw outputs from score aggregation.
- **Provider Neutral**: Connects to local Ollama endpoints or optional remote LLM APIs (OpenAI, Anthropic, Google GenAI) with pre-transmission consent warnings.
- **Scholarly Attribution**: DOI-ready publication workflows with DataCite metadata (`CITATION.cff`, `codemeta.json`, `.zenodo.json`).

---

## Start Here

- 📖 **[Quick Start Guide](Docs/QUICK_START.md)**: 9-step canonical onboarding flow (`install → doctor → connector → preflight → smoke → benchmark → inspect → export → reproduce`).
- 💻 **[Installation Matrix](Docs/INSTALLATION_MATRIX.md)**: Platform dependencies, Docker setup, and environment compatibility.
- 🔒 **[Offline Guide](Docs/OFFLINE_GUIDE.md)**: Zero network data egress posture and `--safe-mode` usage.
- 🌐 **[Remote Provider Guide](Docs/REMOTE_PROVIDER_GUIDE.md)**: Setup for OpenAI, Anthropic, and Google GenAI with credential protection.
- 🔬 **[Reproduction Walkthrough](Docs/REPRODUCTION_WALKTHROUGH.md)**: Step-by-step score reproduction and raw evidence inspection.
- 📚 **[Documentation Index](Docs/DOCUMENTATION_INDEX.md)**: Complete map of user guides, API references, architecture specs, and audit reports.
- ❓ **[FAQ](Docs/FAQ.md)**: Answers to common questions.

---

## Quick Start (3 Command Verification)

```bash
# 1. Clone & Install
git clone https://github.com/Semant-iq/Semantiq.git
cd Semantiq
pnpm install

# 2. Run Diagnostics Doctor
pnpm doctor

# 3. Run Local Offline Smoke Test
node tools/automation/cli.mjs smoke
```

---

## License & Attribution

- **Source Code**: [MIT License](LICENSE)
- **Documentation**: [Creative Commons Attribution 4.0 International (CC-BY-4.0)](Docs/LICENSING_REPORT.md)
- **Baseline Data**: [CC0-1.0 Universal Public Domain](examples/identifiers/benchmark-pack.json)

For citation metadata, see [CITATION.cff](CITATION.cff) or [Docs/CITATION_GUIDE.md](Docs/CITATION_GUIDE.md).
