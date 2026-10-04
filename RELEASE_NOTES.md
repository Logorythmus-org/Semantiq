# Release Notes

> **Historical note:** the material below is the `v0.1.0-alpha.1` release-candidate record.
> It is retained as provenance and is not the current SemantIQ release description.
>
> The current provisional source identity is **`0.1.0-alpha.2` — Public Alpha
> (Experimental)**. A current GitHub Release for alpha.2 is not established by this file.
> Historical readiness, test, connector, accessibility, or documentation claims below must not be
> promoted to current evidence without fresh verification.
>
> See [Versioning & Release Policy](Docs/VERSIONING_POLICY.md),
> [Known Limitations](Docs/KNOWN_LIMITATIONS.md), and the actual GitHub Releases page for current
> release-state evidence.

## SemantIQ Benchmarks v0.1.0-alpha.1 Release Candidate

This release candidate establishes **SemantIQ Benchmarks** as an independent, open-source, local-first evaluation toolkit.

## Highlights

- **First-Run UX & Diagnostics**: `pnpm doctor` CLI diagnostic tool.
- **Explainable Evaluation Engine**: Rubric scoring, evidence separation, and score reproduction.
- **Model Connectors**: Local Ollama support + authorized remote connectors with privacy warnings.
- **Privacy & Security**: Zero telemetry defaults and local-only Safe Mode.
- **Audit & Documentation**: 100% test passage, WCAG 2.2 AA accessibility alignment, and complete documentation set.

## Known Validation Notes

- Controlled Public Alpha scope — enterprise SaaS and payment features deferred.
- Remote provider calls require user configuration of API keys in local `.env`.
