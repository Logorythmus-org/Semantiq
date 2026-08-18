# ADR-0189: Documentation README and Public Limitations Rewrite (Prompt 16)

## Status
Accepted

## Context
Scientific benchmark software documentation must establish clear, unambiguous expectations regarding what works today versus experimental or future roadmap items, avoiding misleading marketing hype or unwarranted certification claims.

## Decision
1. **Five-Tier Readiness Taxonomy**:
   - Classifies repository capabilities into: `WORKS TODAY`, `EXPERIMENTAL`, `OPTIONAL`, `NOT IMPLEMENTED`, and `ROADMAP`.
2. **README.md Overhaul**:
   - Updates the root README to prominently feature the 5-tier classification and link to onboarding guides.
3. **Mandatory Canonical Disclaimer**:
   - Enforces the inclusion of the canonical non-certification disclaimer on all documentation entrypoints:
     > *"This result describes observed behavior in the specified evaluation environment. It does not certify the system as safe, reliable, legally compliant, intelligent, or suitable for a specific deployment."*
4. **Transparent Limitations Publication**:
   - Registers all accepted alpha boundaries in `Docs/ACCEPTED_LIMITATIONS_REGISTER.md`.
5. **Behavioral Grounding Boundary**:
   - `Context → Interpretation → Decision → Action → Result → Consequence → Recovery`.
   - Documentation describes observable behavioral capabilities only.

## Consequences
- Protects the project from liability and prevents exaggerated marketing claims.
- Establishes transparent user expectations for Public Alpha `v0.1.0-alpha.1`.
- Verdict: `PASS`.
