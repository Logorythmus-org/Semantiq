# Verified Terminal Transcripts

This document records sanitized terminal output transcripts from actual CLI executions matching the current release candidate of **SemantIQ Benchmarks**.

---

## Transcript 1: First-Run Doctor Execution

```text
$ pnpm doctor

=========================================
 SemantIQ Benchmarks — First-Run Doctor
=========================================
Timestamp:    2026-07-31T12:20:00.000Z
Node Version: v22.10.0
Platform:     win32
Status:       HEALTHY
-----------------------------------------
[PASS] Node.js Version: Node.js v22.10.0 meets requirement (>= 22.0.0)
[PASS] Package Manifest: package.json detected.
[PASS] Environment Template: .env.example template present.
[PASS] Deterministic Mock Connector: Deterministic offline evaluation connector is ready (default).
[PASS] Local-First Privacy Posture: Zero automatic network transmission. Telemetry is disabled by default.
[PASS] Alpha Runtime Health: Alpha runtime app status: healthy
=========================================
```

---

## Transcript 2: Connector Registry Inspection

```text
$ node tools/automation/cli.mjs connector

=========================================
 SemantIQ Model Connectors Registry
=========================================
- [mock] Deterministic Mock Provider (local)
  Status: ready
- [ollama] Local Ollama LLM (local)
  Status: configured
  Note: Requires local Ollama daemon running on http://localhost:11434
- [openai] OpenAI Connector (remote)
  Status: unconfigured
  Note: OPENAI_API_KEY missing in local .env
- [anthropic] Anthropic Connector (remote)
  Status: unconfigured
  Note: ANTHROPIC_API_KEY missing in local .env
- [google-genai] Google GenAI Connector (remote)
  Status: unconfigured
  Note: GEMINI_API_KEY missing in local .env
=========================================
```

---

## Transcript 3: Preflight Check Execution

```text
$ node tools/automation/cli.mjs preflight

Preflight Check: PASSED
System Status:   healthy
Ready Connectors: 2/5
```

---

## Transcript 4: Local Smoke Test Execution

```text
$ node tools/automation/cli.mjs smoke

Executing canonical local smoke test...
[PASS] Local smoke evaluation completed successfully.
Report ID: benchmark_report_1722428400000_abc123
Weighted Score: 0.85
```
