# Remote Provider Setup & Safety Guide

SemantIQ defaults to local-first execution. OpenAI, Anthropic, Google GenAI, and custom-provider
configuration names are documented integration targets; this repository does not currently contain
verified runtime connectors that authenticate, issue provider requests, or parse provider responses.

---

## Safety & Privacy Disclosure

> [!WARNING]
> A future remote connector would transmit benchmark prompts and evaluation targets to an external
> endpoint. Before implementing or enabling such a connector:
> 1. Ensure you have user consent for data transmission.
> 2. Never commit API keys or secrets to Git repository files.
> 3. Store credentials in local `.env` files (which are git-ignored).

---

## Documented provider surfaces

| Provider ID | Provider name | Configuration reference | Current status |
|---|---|---|---|
| `openai` | OpenAI API | `OPENAI_API_KEY` | Documented/config-diagnostic only; no verified connector |
| `anthropic` | Anthropic API | `ANTHROPIC_API_KEY` | Documented/config-diagnostic only; no verified connector |
| `google-genai` | Google GenAI | `GEMINI_API_KEY` | Documented target only; no verified connector |
| `custom-http` | Custom provider | `CUSTOM_PROVIDER_URL` | Planned surface; no verified connector |

---

## Configuration preparation

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your authorized API key to `.env`:
   ```env
   OPENAI_API_KEY=sk-...
   # or
   ANTHROPIC_API_KEY=sk-ant-...
   # or
   GEMINI_API_KEY=AIza...
   ```

3. Inspect configuration diagnostics:
   ```bash
   pnpm connector
   ```

---

This diagnostic does not perform provider authentication, a network request, response parsing, or a
compatibility test. Do not add real credentials unless a reviewed opt-in connector implementation
requires them.

## Target error behavior

- Missing-credential, quota, retry, and provider-specific recovery behavior are requirements for a
  future connector, not verified current runtime behavior.
