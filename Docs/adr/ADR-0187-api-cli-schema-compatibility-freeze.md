# ADR-0187: API CLI Schema and Compatibility Freeze (Prompt 14)

## Status
Accepted

## Context
Preparing SemantIQ Public Alpha (`v0.1.0-alpha.1`) requires freezing all public CLI interfaces, Draft 2020-12 schemas, exported TypeScript types, and result formats to guarantee stability for third-party benchmark runners and adapter developers.

## Decision
1. **Freeze Core CLI Interface**:
   - Freezes subcommands: `run`, `replay`, `validate`, `providers`, `report`.
2. **Freeze Schema Suite**:
   - Locks all 37 Draft 2020-12 schemas covering tasks, evidence packages, events, execution contracts, and verifiable receipts.
3. **Freeze Exported Types**:
   - `packages/sandbox-contracts/src/index.ts` is the authoritative public interface.
4. **Version Identifier Pinned**:
   - Sets public alpha baseline identifier to `v0.1.0-alpha.1`.
5. **Behavioral Grounding Boundary**:
   - `Context → Interpretation → Decision → Action → Result → Consequence → Recovery`.
   - Freezes schemas to evaluate observable external evidence only.

## Consequences
- Guaranteed interface stability for external developers and research teams.
- Clear contract boundaries prevent accidental breaking changes in minor updates.
- Verdict: `PASS`.
