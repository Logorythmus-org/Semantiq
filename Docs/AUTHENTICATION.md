# Authentication

Authentication is provider-independent. Adapters translate unified credentials into provider-specific flows.

## Supported Methods

- OAuth2
- OpenID Connect
- API keys
- JWT
- personal access tokens
- local credentials
- service accounts
- future passkeys
- future semantic identity

## Token Storage

Tokens and secrets are stored through secure secret providers. Modules receive credential handles, not raw secrets.

## Refresh

Refresh logic belongs in authentication adapters and never in domain modules.

## Identity Authentication

Tech Club authentication supports local accounts, OAuth2, OIDC, Google, GitHub, Microsoft, Apple, passkeys, hardware keys, biometrics, and future decentralized identity through provider adapters.

Authentication proves control of an identity. It does not decide authorization by itself.
