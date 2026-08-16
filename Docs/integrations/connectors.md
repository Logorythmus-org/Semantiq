# Model Connectors & Providers

SemantIQ supports both local and remote model execution providers:

| Provider | Type | Setup Requirement | Privacy Guarantee |
|:---|:---|:---|:---|
| **Deterministic Mock** | Local | Ready out-of-the-box (default) | 100% offline, zero network |
| **Local Ollama** | Local | `http://localhost:11434` | Local machine execution |
| **OpenAI** | Remote | `OPENAI_API_KEY` in `.env` | Cloud API (explicit consent) |
| **Anthropic** | Remote | `ANTHROPIC_API_KEY` in `.env`| Cloud API (explicit consent) |
| **Google GenAI** | Remote | `GEMINI_API_KEY` in `.env` | Cloud API (explicit consent) |

Inspect connector readiness:
```bash
npx tsx tools/automation/cli.mjs connector
```
