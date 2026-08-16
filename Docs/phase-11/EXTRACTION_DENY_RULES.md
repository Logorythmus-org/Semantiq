# Extraction Deny Rules (Default-Deny Policy)

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-03

---

## Default-Deny Rules

1. Any file path not explicitly listed in `includedPaths` is denied by default.
2. Any path containing `..`, absolute root slashes, or symlink escapes is rejected.
3. Any path matching `.git`, `.env`, or credential patterns is denied and forbidden in extraction builds.
