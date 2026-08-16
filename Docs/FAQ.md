# Frequently Asked Questions (FAQ)

---

## 1. General Questions

### What is SemantIQ Benchmarks?

SemantIQ Benchmarks is an independent, open-source, local-first evaluation toolkit for measuring the quality, reasoning, consistency, evidence grounding, and scientific potential of AI model outputs.

### Is SemantIQ a cloud service or SaaS platform?

No. SemantIQ is designed to be 100% local-first. It runs on your own hardware without mandatory cloud connections, hosted user accounts, central telemetry, or paid subscriptions.

### What license is SemantIQ released under?

The source code is licensed under the permissive **MIT License**. Documentation is provided under **Creative Commons Attribution 4.0 International (CC-BY-4.0)**, and synthetic baseline benchmark packs are released under **CC0-1.0 Universal**.

---

## 2. Execution & Model Connectors

### Can I run SemantIQ completely offline?

Yes! In default mode or Safe Mode (`--safe-mode`), SemantIQ executes all evaluation profiles locally using in-process deterministic scoring or local LLM engines (e.g., Ollama running at `http://localhost:11434`).

### Does SemantIQ support external LLM APIs like OpenAI or Anthropic?

Yes. Authorized remote provider connectors are supported for OpenAI, Anthropic, and Google GenAI. However, they require explicit configuration of API keys in local `.env` files and display explicit data transmission warnings before any prompts leave your local workstation.

### Does SemantIQ send telemetry or usage analytics back to a central server?

No. Telemetry is disabled by default. No background network requests or tracking calls are made without explicit user consent.

---

## 3. Evidence & Reproducibility

### How does SemantIQ ensure evaluation reproducibility?

Every evaluation run generates a deterministic report containing the input content, scoring profile, weights, pipeline version, raw execution evidence, and cryptographic hashes. Re-running the evaluation with the same inputs and profile produces identical scores.

### How are raw execution evidence and score rubrics separated?

SemantIQ preserves raw LLM response outputs, latency measurements, and evidence references independently from human interpretation and weighted score summaries.

---

## 4. Diagnostics & Troubleshooting

### How do I verify my environment setup?

Run the first-run doctor command:

```bash
pnpm doctor
# or
node tools/automation/cli.mjs doctor
```

### What should I do if an external API key is invalid or quota is exhausted?

SemantIQ captures credential errors (`ERR_MISSING_CREDENTIAL`) and rate limits (`ERR_QUOTA_EXHAUSTED`) gracefully, suggesting next steps or falling back to local offline evaluation.
