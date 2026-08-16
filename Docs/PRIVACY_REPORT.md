# Privacy & Network Behavior Audit Report

This document records the privacy audit, network behavior analysis, data residency verification, and consent model for **SemantIQ Benchmarks**.

---

## Privacy Audit Summary

| Privacy Metric           | Behavior               | Audit Result                                                      |
| ------------------------ | ---------------------- | ----------------------------------------------------------------- |
| **Default Telemetry**    | Disabled               | Verified — Zero automatic network requests or tracking ping.      |
| **Data Transmission**    | Local-only by default  | Verified — Evaluation prompts remain in local RAM/disk.           |
| **External AI Calls**    | Consent required       | Verified — Requires local `.env` API key setup and consent check. |
| **Federation Sharing**   | Invitation-only        | Verified — Explicit approval required for cross-node sharing.     |
| **User Data Control**    | Exportable & Deletable | Verified — `exportUserData()` and `deleteUserData()` implemented. |
| **Diagnostic Redaction** | Auto-redacted          | Verified — Tokens, passwords, and private titles redacted.        |

---

## Data Inventory

- **Local Identity**: Stored locally in workspace database; exportable & deletable.
- **Workspace Content**: Local JSON/SQLite storage; exportable & deletable.
- **Telemetry Data**: Optional; off by default; 30-day max retention if consented.
- **Consent Records**: Audited locally with explicit timestamp and evidence string.

---

## Verdict

**PASSED** — Local-first privacy guarantees verified. No unauthorized network telemetry or data leakage detected.
