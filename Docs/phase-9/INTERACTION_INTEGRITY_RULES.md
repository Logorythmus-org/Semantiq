# Interaction Integrity Rules

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Interaction Rules

- **Sequence Monotonicity**: `sequenceNumber` must strictly increase.
- **Parent Resolution**: `responseToInteractionId` must reference an existing message.
- **Sender/Recipient Verification**: All actors must be registered identities.
