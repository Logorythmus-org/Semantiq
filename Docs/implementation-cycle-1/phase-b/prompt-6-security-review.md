# Prompt 6 Security Review

## Findings Closed

- Report/audit reads capability-gated; public report count removed.
- Discovery restriction moved into SQL; exact/graph/semantic public access fails closed.
- Active duplicate source/report/case invariants protected by partial unique indexes.
- Audit and moderation actions protected from update/delete by triggers.
- Audit metadata and content sizes bounded; secret-like keys and idempotency keys rejected.
- Limiter keys hashed and never returned; stable retry contract tested.
- Moderator archive/restore preserves normal revision and event history.

## Residual

- Medium: local limiter is process-local and resets on restart; distributed enforcement is deferred.
- Low: bounded graph privacy filtering performs per-node state reads (maximum 100 nodes).
- Low: capability actors come from local environment configuration pending durable Auth integration.
- Low: appeal, emergency redaction, and audit retention governance remain explicitly deferred.

No critical or high finding remains in Prompt 6 scope.
