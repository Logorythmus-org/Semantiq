# Historical Internal Reproduction Attempt Record

**Status**: `HISTORICAL`

**Evidence origin**: Owner-controlled project environment

**Independence classification**: Not independent external replication

This preserved Phase 6 record was previously titled “Independent Reproduction Attempt Report.”
The recorded execution was performed within the project environment and therefore does not satisfy
the current [independence criteria](REPRODUCTION_WALKTHROUGH.md#2-independence-criteria). Its
historical “verified reproducible” wording described an internal deterministic comparison; it did
not establish independently reviewed third-party replication.

## Recorded setup and parameters

- **Environment**: Windows 11 (Node.js v22.10.0, pnpm 11.7.0)
- **Target subject**: Synthetic smoke question (`canonical_e2e_001`)
- **Scoring profile**: Smoke Profile (`profile_smoke`)
- **Execution mode**: Deterministic Local Mock

## Recorded execution

1. Initial run:
   - Command: `node tools/automation/cli.mjs smoke`
   - Recorded weighted score: `0.85`
   - Runtime report ID generated
2. Reproduction run:
   - Command: `node tools/automation/cli.mjs reproduce`
   - Recorded weighted score: `0.85`
   - Recorded score delta: `0.000`

These values are retained as historical claims from the original report and are not current
first-result expectations. The current canonical command and review workflow are documented in the
[Independent Replication Guide](REPRODUCTION_WALKTHROUGH.md).

## Corrected verdict

**INTERNAL REPRODUCTION RECORD** — useful as owner-controlled historical evidence only. It is not
an external reproduction submission, verified external replication, independent scientific
validation, adoption evidence, or production evidence.
