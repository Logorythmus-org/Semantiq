# Offline-Only Onboarding & Evaluation Guide

**SemantIQ Benchmarks** is designed from the ground up to operate **100% offline-first**. Zero external network connections, zero SaaS dependencies, and zero mandatory cloud accounts are required to evaluate benchmarks, store results, inspect raw evidence, and export reports.

---

## Offline Principles

1. **Zero Data Egress**: No prompts, model outputs, evidence, or telemetry are transmitted outside your local system unless you explicitly configure and authorize a remote provider connector.
2. **Local Deterministic Evaluation**: Deterministic scoring profiles run entirely in-process using Node.js.
3. **Local LLM Integration**: Support for local model engines (e.g. Ollama, llama.cpp, vLLM) via local HTTP endpoints (`http://localhost:11434`).
4. **Safe Mode Protection**: Enable Safe Mode (`--safe-mode`) to hard-disable all network-capable features.

---

## Running in Offline Safe Mode

To launch SemantIQ in 100% local Safe Mode:

```bash
node tools/automation/cli.mjs safe-mode
```

This configuration:
- Disables external provider connectors.
- Disables federation sharing.
- Disables external plugin network requests.
- Restricts evaluator execution to deterministic offline scoring profiles.

---

## Offline Onboarding Steps

1. Clone or unpack repository archive on your offline workstation.
2. Run `pnpm doctor` to verify Node.js 22 runtime and package manifests.
3. Run `node tools/automation/cli.mjs smoke` to execute local offline evaluation.
4. Export JSON or Markdown evaluation reports locally via `node tools/automation/cli.mjs export`.
