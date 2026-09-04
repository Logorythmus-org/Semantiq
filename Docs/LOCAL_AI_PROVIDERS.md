# Local AI Providers

Implemented: deterministic local rules provider.

Documented targets: Ollama and OpenAI-compatible endpoints. Diagnostics can detect configuration,
but no request/response adapter or verified automatic fallback currently exists. The mock provider
is test-only.

External requests are disabled by default and require explicit permission, redaction, provider indicator, and audit records.
