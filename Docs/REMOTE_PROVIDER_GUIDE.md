# Remote Provider Setup & Safety Guide

While **SemantIQ Benchmarks** defaults to local-first execution, authorized remote provider connectors (OpenAI, Anthropic, Google GenAI, custom HTTP) can be configured for model evaluation when explicitly requested.

---

## Safety & Privacy Disclosure

> [!WARNING]
> Remote provider connectors transmit benchmark prompts and evaluation targets to external third-party API endpoints. Before configuring remote connectors:
> 1. Ensure you have user consent for data transmission.
> 2. Never commit API keys or secrets to Git repository files.
> 3. Store credentials in local `.env` files (which are git-ignored).

---

## Supported Remote Connectors

| Provider ID | Provider Name | Environment Variable | Auth Required | Data Transmission |
|---|---|---|---|---|
| `openai` | OpenAI API | `OPENAI_API_KEY` | Yes | Remote HTTPS |
| `anthropic` | Anthropic Claude | `ANTHROPIC_API_KEY` | Yes | Remote HTTPS |
| `google-genai` | Google Gemini | `GEMINI_API_KEY` | Yes | Remote HTTPS |
| `custom-http` | Custom Provider | `CUSTOM_PROVIDER_URL` | Optional | Custom HTTPS |

---

## Setup Instructions

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

3. Run connector verification:
   ```bash
   node tools/automation/cli.mjs connector
   ```

---

## Error Handling & Recovery

- **Missing Credential**: If an API key is missing, SemantIQ halts execution with a clear error code (`ERR_MISSING_CREDENTIAL`) and points to `.env` configuration instructions.
- **Quota Exhaustion**: If HTTP 429 / Quota Limit is received, SemantIQ logs `ERR_QUOTA_EXHAUSTED` and suggests retrying later or falling back to local evaluation.
- **Network Disconnection**: Interrupted remote calls trigger automatic retry with exponential backoff before reporting `ERR_NETWORK_DISCONNECTED`.
