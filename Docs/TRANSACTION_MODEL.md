# Transaction Model

Transactions are auditable economy events.

## Transaction Types

Free claim, purchase, donation, sponsorship, license grant, revenue split, refund, transfer, subscription, and access expiry.

## Transaction Fields

Transaction identity, asset, buyer or claimant, seller or grantor, amount, currency, transaction type, license reference, revenue share references, wallet record references, status, and audit history.

## Payment Abstraction

Payment providers are adapters. Economy contracts record intent, status, audit, and wallet references without hard-coding a payment network.
