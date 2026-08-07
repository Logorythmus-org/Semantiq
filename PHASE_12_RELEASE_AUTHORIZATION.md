# Phase 12 Release Authorization Document

**Project**: SemantIQ Benchmarks  
**Decision ID**: `auth-semantiq-v0.1.0-alpha.1`  
**Date**: 2026-08-07  
**Approved Release Level**: `Level 2 — Public Alpha`  
**Phase 12 Authorized**: **YES**

---

## 1. Release Level Determination

SemantIQ has successfully passed all 8 Readiness Gates (Gates A through H) and 20 pre-release adversarial red-team scenarios with 0 critical blockers.

- **Approved Level**: **Level 2 — Public Alpha**
- **Scope**: Reproducible evaluation candidate `semantiq-v0.1.0-alpha.1` with explicit claim boundaries, human responsibility safeguards, anti-gaming contamination controls, rubric assumption manifests, contestability/dispute protocols, community governance, self-observation framework, and adversarial simulation proof.

---

## 2. Excluded Components

- `tier_d_protected_challenge_fixtures` (Must remain strictly segregated from public candidate release bundles).

---

## 3. Rollback Trigger & Conditions

- **Rollback Trigger**: Discovery of unhandled credential leaks, unhandled prompt injection vulnerability, or un-disclaimed scientific safety claim.
- **Expiration**: `2026-11-01T00:00:00Z`
