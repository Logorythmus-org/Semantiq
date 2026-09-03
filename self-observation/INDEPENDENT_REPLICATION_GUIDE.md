# Owner-Controlled Clean-Room Verification Guide

**Version**: 1.1.0

**Date**: 2026-08-07

**Status**: `HISTORICAL / INTERNAL`

This self-observation guide records the repository's owner-controlled clean-room procedure. It is
not the public independent-replication submission path and cannot establish external replication.
Third parties should use the current
[Independent Replication Guide](../Docs/REPRODUCTION_WALKTHROUGH.md).

---

## 1. Objective

This guide provides deterministic steps for the project's internal clean-room verification of the
SemantIQ build, validation, and benchmark test results.

---

## 2. System Prerequisites

- **Node.js**: `>= 20.0.0` (Tested on `v22.15.0`)
- **pnpm**: `>= 9.0.0` (Tested on `11.7.0`)
- **Operating System**: Linux, macOS, or Windows (tested on `win32`)
- **Git**: `>= 2.30.0`

---

## 3. Clean-Room Installation

1. **Clone or Extract Candidate**:

   ```bash
   git clone <repo-url>
   cd <repo-dir>
   ```

2. **Isolated Dependency Installation**:
   ```bash
   pnpm install --frozen-lockfile
   ```

---

## 4. Full Verification Suite

Execute the following verification steps in sequence:

1. **Product Boundary Validation**:

   ```bash
   node scripts/boundary-validator.mjs
   ```

   _Expected Output_: `[BOUNDARY VALIDATION PASSED]: SemantIQ product boundary is clean.`

2. **TypeScript Strict Typecheck**:

   ```bash
   pnpm typecheck
   ```

   _Expected Output_: Exit code 0 with zero typecheck errors.

3. **Full Vitest Test Suite**:

   ```bash
   pnpm test
   ```

   _Expected Output_: Exit code 0 with all test files and unit tests passing.

4. **Checksum & Provenance Verification**:
   Inspect `release-candidates/semantiq-v0.1.0-alpha.1/CHECKSUMS.sha256` and `INVENTORY.md` to confirm artifact integrity against generated bundles.

---

## 5. Logging Internal Results

Record this owner-controlled execution against
`schemas/clean-room-replication-record.schema.json` with `reproducibilityStatus` set to
`internal_clean_room_reproduction`. The historical schema also contains an
`external_independent_reproduction` enum value, but a submitter-selected value cannot grant
independent status. External attempts require the public guide, structured submission, and
maintainer provenance review.
