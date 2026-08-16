# Consent And Privacy

Spec ID: S7-CONSENT

## Consent Model

Consent must be explicit before behavioral research data is collected. Core product functionality must remain available without telemetry or research participation.

Supported consent levels:

- No Research Data
- Basic Anonymous Metrics
- Detailed Product Metrics
- Diagnostic Logs
- Usability Session
- Screen Recording
- Interview Participation
- AI Output Evaluation
- Federation Test Participation

Each level must be independently selectable and revocable. A user may withdraw consent without losing access to local workspace functionality.

## Required User-Facing Explanation

Before consent, explain:

- What is collected.
- What is not collected.
- Why it is collected.
- How long it is retained.
- Whether logs remain local.
- Whether diagnostics are uploaded.
- Whether AI prompts are recorded.
- Whether screen recordings are used.
- How consent can be withdrawn.
- How data can be exported.
- How data can be deleted.

## Default Privacy Rules

- Telemetry is off by default.
- Default metrics must not include raw question content, full prompts, full AI responses, personal identifiers, files, documents, secret values or private workspace content.
- Diagnostic upload requires separate consent.
- Screen recording requires separate consent.
- Interview participation requires separate consent.
- AI output evaluation requires separate consent.
- Federation testing requires separate consent.

## Enforcement

Instrumentation must check current consent at event recording time. Consent withdrawal stops future collection and marks previous research data for deletion or retention according to the visible retention policy.

## Audit Evidence

For every consent change, retain a pseudonymous audit record with timestamp, consent levels, retention period, withdrawal state and the UI or command surface used to make the change.
