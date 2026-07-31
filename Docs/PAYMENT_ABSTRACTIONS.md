# Payment Abstractions

Payment and wallet integrations are prepared through provider-independent contracts. No payment provider is implemented in Phase 1.

## Providers
- Stripe
- PayPal
- crypto wallets
- Semantic Wallet
- future providers

## Boundaries
Payments, ownership, wallet assets, and semantic identity remain separate domain concepts. Providers process external actions through adapter contracts.
