# Artifact Identity Model

This document defines the formal identity model for **SemantIQ Benchmarks** artifacts.

---

## Identity Separation Architecture

SemantIQ separates **Artifact Identity**, **Version Identity**, and **Cryptographic Content Identity**:

1. **Artifact Identity (`artifact_id`)**:
   - Primary internal handle. Remains invariant when files are moved within a repository or migrated between hosts.
   - Example: `semantiq:benchmark-pack:synthetic-smoke:v1.0.0`

2. **Version Identity (`version`)**:
   - Semantic versioning identifier (`MAJOR.MINOR.PATCH[-PRERELEASE]`).
   - Example: `0.1.0-alpha.1`

3. **Content Identity (`content_hash`)**:
   - Cryptographic SHA-256 digest calculated over normalized UTF-8 string content.
   - Example: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`

---

## Provenance Relationship Vocabulary

| Relationship    | Meaning                      | Example                                                                                                |
| --------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| `isVersionOf`   | Parent concept / series      | `semantiq:benchmark-pack:synthetic-smoke:v1.0.0` isVersionOf `semantiq:benchmark-pack:synthetic-smoke` |
| `hasVersion`    | Child version                | `semantiq:benchmark-pack:synthetic-smoke` hasVersion `v1.0.0`                                          |
| `isDerivedFrom` | Derived benchmark or dataset | `semantiq:dataset-pack:eval-2026` isDerivedFrom `semantiq:benchmark-pack:synthetic-smoke:v1.0.0`       |
| `documents`     | Documentation target         | `semantiq:doc:quickstart` documents `semantiq:software-release:semantiq-benchmarks:v0.1.0-alpha.1`     |
| `usesDataset`   | Evaluation dataset           | `semantiq:evaluation-report:rpt-001` usesDataset `semantiq:dataset-pack:eval-2026`                     |
| `usesModel`     | Evaluated model backend      | `semantiq:evaluation-report:rpt-001` usesModel `ollama-llama3`                                         |
| `generatedBy`   | Generator tool               | `semantiq:evaluation-report:rpt-001` generatedBy `semantiq-engine-v0.1.0`                              |

---

## Collision & Deprecation Handling

- **Collision Avoidance**: Artifact slugs use hierarchical namespaces (`semantiq:<type>:<slug>:<version>`).
- **Deprecation**: Deprecated artifacts maintain their original ID, setting `status: "deprecated"` in metadata.
