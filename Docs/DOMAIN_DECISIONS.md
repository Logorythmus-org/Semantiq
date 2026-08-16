# Domain Decisions

## ADR-D001: Question Is The Root Aggregate
Status: Accepted

Questions are the primary object of Tech Club. Projects, knowledge, games, research, and learning may exist independently, but their platform meaning is established through questions.

## ADR-D002: Relationships Are First-Class Objects
Status: Accepted

Relationships carry identity, type, provenance, confidence, lifecycle, permissions, and versioning. This supports semantic search, graph traversal, audit, and agent reasoning.

## ADR-D003: Domain Model Is Storage Independent
Status: Accepted

Tech Club must support SQLite, PostgreSQL, DuckDB, graph databases, object storage, and vector storage without changing aggregate models.

## ADR-D004: Events Are The Published Language
Status: Accepted

Bounded contexts communicate through versioned domain events and public APIs. Internal aggregate state is never shared directly.

## ADR-D005: Plugins Use Capability-Based Isolation
Status: Accepted

Plugins register explicit capabilities and interact through extension hooks. They do not bypass module public APIs.

## ADR-D006: Agents Cannot Mutate Internals Directly
Status: Accepted

Agents inspect, summarize, evaluate, transform, link, benchmark, and recommend through commands, queries, and tools. Human approval policies decide whether changes are applied.
