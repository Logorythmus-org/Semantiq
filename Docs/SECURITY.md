# Security Architecture

Phase 1 prepares security boundaries without implementing authentication.

## Foundations
- Permission model: actions are authorized through explicit capabilities.
- Role model: roles group capabilities but do not replace per-action checks.
- Encrypted storage: storage contracts must support encryption at rest.
- Secret management: secrets are injected and never committed.
- Audit logging: sensitive commands emit audit events.
- Zero trust: modules authenticate their dependencies through explicit contracts.

## Deferred
- User authentication.
- Blockchain identity.
- Production key management.
- Remote policy enforcement.

## Integration Security
External providers are isolated behind adapters. Credentials are stored through secret providers and exposed to modules only as handles. Gateway requests carry actor, session, provider, scope, and correlation metadata.

Integration security covers secrets, credentials, encryption, token storage, permission boundaries, provider isolation, audit logs, zero trust, sandboxing, and data privacy. Provider failures or missing credentials must not break local-first operation.

## Identity Security
Identity is local-first and provider-independent. Authorization is explainable through roles, attributes, capabilities, policies, semantic permissions, ownership, trust, and context.

Security events include `UserAuthenticated`, `AuthenticationFailed`, `PermissionGranted`, `PermissionRevoked`, `PolicyChanged`, `OwnershipTransferred`, `WalletUpdated`, `CredentialIssued`, `CredentialRevoked`, and `SecurityAlert`.
