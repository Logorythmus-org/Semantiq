# Security Model

Kernel security is capability-based and zero-trust by default.

## Responsibilities

- permission checks
- capability validation
- secure module loading
- plugin isolation
- secret access
- audit logging
- session context
- future semantic identity
- zero-trust communication

## Runtime Context

Every operation carries actor, session, capabilities, correlation id, and optional workspace/project scope.

## Secrets

Secrets are accessed through handles and approved providers. Raw secret values should not be stored in module configuration.

## Identity Security

Security is layered through identity, authentication, authorization, capability evaluation, permission evaluation, policy evaluation, Semantic Wallet claims, audit records, encrypted storage, and infrastructure controls.

Zero Trust applies to users, agents, plugins, modules, adapters, and future distributed services.
