# Question Runtime Security Model

Local actor context comes from bounded `x-actor-id`; body actor fields never grant authority. Creator ownership, moderator capabilities, CAS versions, parameterized SQL, controlled vocabularies, bounds, duplicate constraints, outbox atomicity, hidden restricted reads, and rate limits provide defense in depth. The header is not authentication; untrusted deployment requires a durable identity/capability layer.
