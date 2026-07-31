# GitHub Release Configuration Report

**Project**: SemantIQ Benchmarks  
**Release Tag**: `v0.1.0-alpha.1`  
**Release Title**: SemantIQ Benchmarks v0.1.0-alpha.1 (Controlled Public Alpha Candidate)  
**Date**: 2026-07-31  

---

## 1. Release Manifest Summary

- **Semantic Version**: `0.1.0-alpha.1`
- **License**: MIT (Code) / CC-BY-4.0 (Docs) / CC0-1.0 (Data)
- **CFF Citation**: `CITATION.cff` (v1.2.0)
- **CodeMeta Manifest**: `codemeta.json` (v2.0)
- **DataCite Schema**: `examples/citation/datacite.json` (v4.4)
- **SBOM**: `Docs/SOFTWARE_BILL_OF_MATERIALS.md`
- **Release Checksums**: `Docs/RELEASE_CHECKSUMS.md`

---

## 2. Release Draft Text

```markdown
# SemantIQ Benchmarks v0.1.0-alpha.1

We are excited to announce the **Controlled Public Alpha Candidate** of **SemantIQ Benchmarks**, an independent, open-source, local-first AI evaluation toolkit.

### Key Highlights
- **Local-First Evaluation**: Run deterministic scoring with zero mandatory cloud telemetry.
- **Explainable Rubrics**: Transparent scoring profiles across reasoning, consistency, and evidence grounding.
- **100% Reproducibility**: Exportable JSON & Markdown reports with 100% score reproduction identity.
- **Provider Neutrality**: Support for Ollama, OpenAI, Anthropic, and Google GenAI backends.
- **Scholarly Attribution**: DOI-ready publication workflow (`CITATION.cff`, `codemeta.json`, `.zenodo.json`).

### Quick Start
```bash
git clone https://github.com/Semant-iq/Semantiq.git
cd Semantiq
pnpm install
pnpm doctor
node tools/automation/cli.mjs smoke
```
```
