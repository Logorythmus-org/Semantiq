# GitHub Release Draft

**Tag**: `v0.1.0-alpha.1`  
**Title**: SemantIQ Benchmarks v0.1.0-alpha.1 (Controlled Public Alpha)  
**Target Branch**: `main`  
**Pre-release**: Yes  

---

## SemantIQ Benchmarks v0.1.0-alpha.1

We are excited to announce the **Controlled Public Alpha Candidate** of **SemantIQ Benchmarks**, an independent, open-source, local-first AI evaluation toolkit.

### Key Highlights

- **Local-First Evaluation**: Run deterministic scoring and local model evaluations with zero mandatory cloud dependencies or telemetry.
- **First-Run Doctor**: Integrated diagnostic suite (`pnpm doctor`) for environment, node version, and package integrity validation.
- **Explainable Rubrics**: Transparent scoring profiles across question quality, reasoning, consistency, and evidence grounding.
- **Reproducible Pipeline**: Exportable JSON & Markdown reports with 100% score reproduction assurance.
- **Authorized Model Connectors**: Support for Ollama, OpenAI, Anthropic, and Google GenAI with explicit pre-transmission data disclosures.
- **Safe Mode**: Hardened local-only mode (`--safe-mode`) for zero-network environments.

---

## Quick Installation

```bash
git clone https://github.com/Semant-iq/Semantiq.git
cd Semantiq
pnpm install
pnpm doctor
node tools/automation/cli.mjs smoke
```

---

## Citation & Attribution

If you use SemantIQ in research or software, please refer to `CITATION.cff` or cite:

```bibtex
@software{semantiq_benchmarks_2026,
  author = {Tech Club Foundation},
  title = {SemantIQ Benchmarks: Local-First AI Evaluation Toolkit},
  version = {0.1.0-alpha.1},
  year = {2026},
  url = {https://github.com/Semant-iq/Semantiq.git}
}
```
