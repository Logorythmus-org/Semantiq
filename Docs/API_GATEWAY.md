# API Gateway

The Universal Gateway is a runtime boundary, not a business logic layer.

## Responsibilities
- routing
- authentication
- authorization
- rate limiting
- caching
- transformation
- validation
- versioning
- logging
- tracing
- health checks
- provider selection
- failover
- future load balancing

## Request Flow
Requests enter through the gateway with a runtime context. The gateway authenticates, authorizes, validates, chooses a provider or local fallback, applies rate and retry policy, invokes an adapter, transforms the response, records diagnostics, and returns a provider-neutral result.

## Rule
Gateway code must not know how questions, projects, benchmarks, wallets, or workspaces behave. It only routes integration calls.
