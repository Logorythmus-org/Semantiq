# Question Aggregate Authority

Status: Existing Phase B contract

The sole authoritative aggregate is `packages/questions/src/domain.ts`: normalized Question text, language, source, optional creator, published/archived lifecycle, timestamps, aggregate version, creator-controlled mutation, optimistic concurrency, immutable revisions, and versioned compact events.

Title/body, draft/locked/deleted states, visibility, generic metadata, and new commands are not implemented Phase E contracts.
