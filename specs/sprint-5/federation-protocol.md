# Federation Protocol

Protocol v1 supports metadata exchange, negotiation, capabilities, authentication challenge, trust/policy exchange, queries, object request/response, replication, events, sync, conflicts, health, and revocation notices.

All messages use an envelope with ID, version, type, sender, recipient, timestamp, expiration, correlation, causation, nonce, signature metadata, encryption metadata, policy context, schema version, payload, and trace.
