# Persistent Identifier Strategy

This document specifies the provider-neutral, open, no-cost persistent identifier strategy for **SemantIQ Benchmarks**.

---

## The No-Cost Resolution Chain

SemantIQ establishes a provider-neutral identifier chain that does not require paid DOI services or central membership fees:

```text
SemantIQ Artifact ID
→ SHA-256 Content Hash
→ Git Commit SHA
→ Git Release Tag
→ GitHub Release URL
→ Zenodo Archive (Free)
→ DataCite Version DOI & Concept DOI
→ ORCID & Citation Metadata
```

---

## Canonical SemantIQ Artifact ID Format

Internal artifact identity is formatted as:

```text
semantiq:<artifact_type>:<artifact_slug_or_uuid>:<version_or_hash>
```

### Supported Artifact Types

| Artifact Type            | Description                          | Format Example                                                 |
| ------------------------ | ------------------------------------ | -------------------------------------------------------------- |
| `software-release`       | Release candidate / release artifact | `semantiq:software-release:semantiq-benchmarks:v0.1.0-alpha.1` |
| `benchmark-pack`         | Structured benchmark definition pack | `semantiq:benchmark-pack:synthetic-smoke:v1.0.0`               |
| `dataset-pack`           | Exported evaluation dataset pack     | `semantiq:dataset-pack:eval-dataset-2026:v1.0.0`               |
| `evaluation-report`      | Generated benchmark report           | `semantiq:evaluation-report:rpt-2026-07-31:a1b2c3d4`           |
| `evidence-bundle`        | Raw execution evidence bundle        | `semantiq:evidence-bundle:ev-bundle-001:v1.0.0`                |
| `provider-snapshot`      | Model connector snapshot             | `semantiq:provider-snapshot:ollama-llama3:2026-07-31`          |
| `plugin`                 | Local plugin package                 | `semantiq:plugin:eval-rubric-plugin:v0.1.0`                    |
| `documentation-snapshot` | Documentation release snapshot       | `semantiq:documentation-snapshot:docs-alpha-1:v0.1.0`          |

---

## Disambiguation of Identities

1. **Artifact Identity** (`artifact_id`): Stable internal identifier independent of repository host or file path.
2. **Version Identity** (`version`): Semantic version or release tag (`v0.1.0-alpha.1`).
3. **Content Identity** (`content_hash`): Cryptographic SHA-256 hash computed over normalized content.
4. **Scholarly Identifier** (`doi` / `concept_doi`): Optional external DataCite/Zenodo DOI metadata.
