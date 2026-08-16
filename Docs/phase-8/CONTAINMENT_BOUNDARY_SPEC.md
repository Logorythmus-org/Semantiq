# Containment Boundary Specification

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Containment Architecture

The `ContainmentBoundary` contract enforces sandbox boundaries:
- **Root Directory Scope**: Actions outside `rootDirectory` trigger `SCOPE ESCAPE VIOLATION`.
- **Domain Allowlist**: Network calls outside `allowedDomainPatterns` fail closed.
- **Secret Redaction**: `redactSecrets()` strips GitHub PATs, JWT tokens, and sensitive strings prior to evidence persistence.
