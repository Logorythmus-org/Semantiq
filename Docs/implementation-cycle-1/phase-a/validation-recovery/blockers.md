# Validation Recovery Blockers

Blocking validation gaps closed: Docker engine, image build, PostgreSQL startup, migration from zero, repeatability, real repository/UoW, outbox commit, API readiness, database failure/recovery, API restart, and persistence across Compose restart.

Remaining non-blocking limitations: container image does not include the full test toolchain; persistent idempotency adapter is not implemented; Docker API health uses TCP availability rather than SQL authentication; two historical lint warnings remain.
