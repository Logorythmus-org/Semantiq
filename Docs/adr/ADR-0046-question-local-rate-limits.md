# ADR-0046: Local Question Rate Limits

Status: Accepted

Use a bounded in-process fixed-window limiter for the local baseline, with injected clock, hashed actor/client keys, explicit disable switch, and stable errors. Distributed enforcement is deferred.
