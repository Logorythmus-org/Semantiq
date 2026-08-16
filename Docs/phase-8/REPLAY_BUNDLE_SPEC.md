# Replay Bundle Format Specification

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01

---

## Replay Bundle Structure

A `ReplayBundle` is a self-contained, reproducible evaluation package:

- `bundleId`: Unique replay bundle identifier.
- `traceId`: Reference ID of recorded agent trace.
- `runId`: Reference ID of agent run.
- `events`: Array of immutable `BehavioralEventSchema` records.
- `evidenceHashes`: Map of resource URIs to expected SHA-256 digests.
