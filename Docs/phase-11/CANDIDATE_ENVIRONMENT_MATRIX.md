# Candidate Environment Matrix (Prompt 11.11)

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-03

---

## Primary Validation Environment

| Property                | Value                            |
| ----------------------- | -------------------------------- |
| Node.js Runtime         | v22.15.0                         |
| Package Manager         | pnpm v11.7.0                     |
| Operating System        | Microsoft Windows 10.0.26200     |
| Architecture            | AMD64                            |
| TypeScript Compiler     | v5.x (via `devDependencies`)     |
| Test Runner             | Vitest v1.x                      |
| Shell                   | PowerShell (pwsh)                |
| Parent workspace access | NONE (isolated run)              |
| Network egress          | BLOCKED (offline mode)           |
| DATABASE_URL            | NOT SET (Postgres tests skipped) |

## Minimum Supported Runtime

| Property        | Requirement                 |
| --------------- | --------------------------- |
| Node.js         | ≥ 18.x LTS                  |
| Package Manager | pnpm ≥ 8.x OR npm ≥ 9.x     |
| TypeScript      | ≥ 5.0                       |
| OS              | Any (Windows, macOS, Linux) |

## Validation Status

| Check                          | Status    |
| ------------------------------ | --------- |
| Install (frozen lockfile)      | ✅ PASSED |
| Typecheck (0 errors)           | ✅ PASSED |
| Boundary validation            | ✅ PASSED |
| Full test suite (405/405)      | ✅ PASSED |
| No parent imports detected     | ✅ PASSED |
| No absolute paths in candidate | ✅ PASSED |
| No secrets or `.git` artifacts | ✅ PASSED |
| Offline-safe execution         | ✅ PASSED |
