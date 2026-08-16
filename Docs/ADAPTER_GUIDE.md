# Adapter Guide

Every external service becomes an adapter.

## Adapter Examples

GitHub, Google Drive, Google Docs, Google Calendar, Gmail, MCP, Docker, OpenAI, Anthropic, Gemini, Ollama, LM Studio, Hugging Face, Kaggle, Semantic Wallet, WebGPU, filesystem, REST, GraphQL, WebSocket, and webhooks.

## Required Adapter Metadata

- provider id
- version
- capabilities
- limitations
- configuration schema
- authentication requirements
- health status
- rate limits
- supported operations

## Rules

- Do not expose provider-specific models to domains.
- Translate provider errors into integration errors.
- Keep provider credentials isolated.
- Support offline fallback where technically possible.
- Emit audit records for sensitive operations.
