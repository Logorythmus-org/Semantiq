# Reuse Analysis

This document records the initial reuse posture. Full inspection happens before any future module implementation adopts external code.

| Repository      | Likely Value                                               | Phase 1 Decision                                              |
| --------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| Qikio           | Previous Agent OS concepts and possible workflow patterns. | Keep external; evaluate for Agent OS adapters.                |
| Sunlionet       | Secure communication, bundle system, mesh networking.      | Keep external; evaluate for infrastructure and mesh adapters. |
| SemantIQ        | Semantic benchmark framework.                              | Candidate adapter for `@tech-club/semantiq`.                  |
| Menog OS        | Local-first agent operating system patterns.               | Keep external; evaluate for workspace and Agent OS reuse.     |
| Semantic Wallet | Wallet, ownership, identity, blockchain concepts.          | Candidate adapter for `@tech-club/wallet`.                    |

## Reuse Rules

- Inspect before duplicating.
- Prefer adapters over direct coupling.
- Record adoption decisions in `docs/DECISIONS.md`.
- Validate licenses, maintenance status, and compatibility.
- Do not vendor code in Phase 1.
