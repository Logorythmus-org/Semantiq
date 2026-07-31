# Transaction Boundaries

Persistence work uses `PostgresUnitOfWork` from `packages/persistence`. A unit of work begins explicitly, performs repository changes, writes outbox events before commit, commits once, then allows post-commit dispatch. Failures roll back and release the client. No database connection is created at module import time.
