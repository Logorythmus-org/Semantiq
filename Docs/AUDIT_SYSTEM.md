# Audit System

Audit logs are immutable records of sensitive activity.

## Audited Areas

Authentication, authorization, permission changes, policy changes, wallet updates, ownership transfers, benchmark execution, agent actions, security events, and system changes.

## Audit Record

Audit records include id, timestamp, actor, action, resource, context, result, correlation id, policy references, signatures, and integrity hash.

## Immutability

Audit records are append-only. Corrections are new records that reference previous records.
