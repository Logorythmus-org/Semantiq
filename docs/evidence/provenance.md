# Cryptographic Evidence Provenance

Every SemantIQ evaluation generates an immutable Merkle trace:

- **Leaf Hashes**: $\text{SHA-256}(\text{event}_i)$
- **Tree Root**: Cryptographically commits the exact sequence of observable transitions.
- **Verifiable Receipt**: Can be independently verified without re-executing the model.
