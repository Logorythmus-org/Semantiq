# SemantIQ Data Handling & Privacy Policy

**Milestone**: SemantIQ Behavioral Evidence Infrastructure 1.0.0  
**Scope**: Storage, Processing, Redaction, and Data Lifecycle  

---

## 1. Data Classification Tiers

| Classification Tier | Data Types | Handling & Storage Policy | Redaction & Encryption |
| :--- | :--- | :--- | :--- |
| **Tier 1: Public Baseline Data** | Standard benchmark tasks, pattern catalog (`DP-001`..`DP-008`), synthetic ground truth. | Stored in repository / public bundle archives under CC0-1.0. | None required (public domain). |
| **Tier 2: Research Evaluation Ledgers** | Step logs, trace events, metric scorecards, matched contrast calculations. | Local-first filesystem storage. Merkle root hash verification. | Agent environment secrets redacted prior to hash chaining. |
| **Tier 3: Governed Evidence Claims** | Draft claims, review decision items, release certificates. | Persisted in local or enterprise database with SHA-256 state hashing. | Controlled language enforcement; no private identifiers. |
| **Tier 4: Partner Study Submissions** | Execution manifests, raw run logs, partner attestations. | Quarantined on arrival; validated against frozen preregistrations. | Full integrity verification; quarantine audit logs preserved. |
| **Tier 5: Credentials & Secrets** | Model API keys, database credentials, provider auth tokens. | **Never persisted to disk or logs**. In-memory resolution only. | Masked with `***REDACTED***` in all exports. |

---

## 2. Ingestion & Storage Architecture

### 2.1 Local-First Filesystem Isolation
All default run artifacts, evaluation outputs, and research bundles are written to local project directories (`.semantiq/` or user-specified output directories). SemantIQ does not require or communicate with cloud storage backends unless explicitly configured by the user.

### 2.2 Cryptographic State Hashing
Every `EvaluationLedgerEntry` and `ResearchBundle` is sealed with SHA-256 hashes:
$$\text{EntryHash} = \text{SHA256}(\text{CanonicalJSON}(\text{Payload}) + \text{PreviousHash})$$
This guarantees tamper evidence and immutability across distributed research sessions.

---

## 3. Partner Artifact Ingestion & Quarantine Protocol

When ingesting external partner manifests:
1. **Validation Against Preregistration**: Compare sample counts, metric thresholds, model fingerprints, and analysis parameters against the frozen pre-registration hash.
2. **Missing-Data & Deviation Check**: Verify missing data ratio $\le 20\%$ and classify deviations.
3. **Quarantine Retention**: Any manifest with unapproved material deviations or invalid checksums is assigned `quarantined` or `rejected` status. Ineligible submissions remain stored locally for cryptographic auditing but **cannot affect the Evidence Graph or promote evidence levels**.

---

## 4. Privacy & Telemetry Boundary

- **Zero Egress**: Default installations generate zero external network requests.
- **No User Tracking**: The CLI and HTTP server contain zero user behavior analytics, tracking pixels, or diagnostic telemetry.
- **Operator Control**: Operators retain 100% control over data retention, archiving, and purging.
