# Integration Platform

The Integration Platform connects Tech Club to external systems while preserving local-first independence. External services are optional adapters. The platform owns business rules.

## Layers

- Presentation Layer: UI and app entry points.
- Application Layer: workflows and use-case orchestration.
- Integration Gateway: provider-neutral routing, auth, validation, transformation, policy checks, and diagnostics.
- Service Adapters: provider-specific implementations behind stable contracts.
- Protocol Adapters: REST, GraphQL, WebSocket, webhooks, CLI, filesystem, Docker, WebGPU, and MCP transport.
- Authentication Layer: OAuth2, OIDC, API keys, JWT, personal access tokens, local credentials, service accounts, future passkeys, and future semantic identity.
- External Providers: optional external services.
- Monitoring: call metrics, latency, failures, rate limits, usage, costs, and provider health.
- Retry Engine: retries, backoff, timeouts, circuit breakers, and dead letters.
- Audit: sensitive operations and provider access records.

## Independence Rule

No domain module imports provider SDKs or depends on provider-specific behavior. Provider-specific behavior is translated by adapters.

## Local-First Rule

Tech Club remains useful without mandatory cloud services. Integrations enhance capabilities but do not define core operation.
