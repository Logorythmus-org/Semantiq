# Sprint 7 Requirements

Spec ID: S7-REQ

## Functional Requirements

- S7-REQ-001: Cohorts must be controlled, invitation-only and pseudonymous.
- S7-REQ-002: Invitations must be single-use, expiring, revocable and scoped to a cohort, tester role and feature profile.
- S7-REQ-003: Invitation links must not expose private infrastructure data.
- S7-REQ-004: Research consent must be granular, explicit, revocable, exportable and deletable.
- S7-REQ-005: Core functionality must remain usable with telemetry disabled.
- S7-REQ-006: Product metrics must exclude private question content, prompts, documents, file contents, personal identifiers and secrets by default.
- S7-REQ-007: Instrumentation must record counts, durations, state transitions, error categories, feature usage and completion status only when consent permits it.
- S7-REQ-008: Onboarding must explain question-centered work, user control, Semantiq uncertainty, local ownership, external AI implications, federation optionality, exports, Safe Mode and experimental limitations.
- S7-REQ-009: First-question flows must support examples, templates, natural-language entry, drafts, AI skip and manual continuation.
- S7-REQ-010: Contextual feedback must be available from the primary alpha surfaces once those surfaces exist.
- S7-REQ-011: Feedback must be classified by taxonomy, severity, context, reproduction evidence and consent state.
- S7-REQ-012: Usability sessions must record first-attempt and assisted performance separately.
- S7-REQ-013: Semantiq feedback must capture user agreement, usefulness, clarity, fairness, disagreement and action taken without automatically changing benchmark weights.
- S7-REQ-014: AI suggestion feedback must capture relevance, clarity, meaning preservation, hallucination, overconfidence, privacy awareness, safety, actionability and user-control outcome.
- S7-REQ-015: Human-control mechanisms must allow rejecting, editing, restoring, cancelling, pausing, denying external calls, inspecting logs, revoking sharing, disabling plugins and entering Safe Mode.
- S7-REQ-016: Reliability monitoring must cover startup, crashes, database locks, migrations, graph inconsistencies, workflows, agents, providers, marketplace, plugins, federation, sync, backup, restore and export.
- S7-REQ-017: Issues must link feedback to specifications, owners, severity, reproduction, fix plan, regression test, target release and resolution evidence.
- S7-REQ-018: Experiments must include stable ID, question, hypothesis, target users, method, evidence, thresholds, privacy implications, duration, owner, result and decision.
- S7-REQ-019: Product decisions must record evidence, alternatives, assumptions, risks, reversal condition, review date and responsible person under `Docs/product-decisions/`.
- S7-REQ-020: Release channels must expose version, build date, commit, schema/API version, feature flags, limitations, upgrade path and rollback path.
- S7-REQ-021: Updates must create a recovery point before migration and must support health validation and rollback.
- S7-REQ-022: Beta readiness must be based on observed or measured evidence, not synthetic runtime success.

## Non-Functional Requirements

- S7-NFR-001: Telemetry is off by default.
- S7-NFR-002: Research data is separated from private workspace content.
- S7-NFR-003: Diagnostic bundles are redacted before sharing.
- S7-NFR-004: Screenshot metadata is stripped before upload when screenshots are supported.
- S7-NFR-005: Accessibility findings enter the main backlog.
- S7-NFR-006: Documentation defects are product defects.
- S7-NFR-007: No unresolved blocker may be hidden in readiness reports.
