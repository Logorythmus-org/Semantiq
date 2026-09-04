# Adapter Guide

External services may be connected through adapters, but a named target is not considered supported
until implementation and meaningful test evidence exist. See the
[Integration Graph](ecosystem/INTEGRATION_GRAPH.md) and
[Public Claim Status](ecosystem/PUBLIC_CLAIM_STATUS.md) for current classifications.

## Current boundaries

- Docker Engine execution is implemented with partial live-daemon validation.
- MCP normalization is contract-only; reference-server transport has not been demonstrated.
- OpenSandbox has an HTTP protocol client, but canonical upstream compatibility and live-daemon
  conformance have not been established.
- E2B behavior is simulated.
- OpenAI, Anthropic, Google GenAI, and Ollama are documented targets/configuration surfaces, not
  verified runtime connectors.
- Hugging Face and Kaggle exporters generate local artifacts; official-tool validation,
  authenticated upload, and publication are not established.

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

These rules describe requirements for implementations. They do not establish that every named
target currently has an implementation.
