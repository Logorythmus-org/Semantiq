# Version DOI vs Concept DOI Strategy

This document describes the **intended distinction** between Version DOIs and
Concept DOIs if SemantIQ is deposited in a DOI-issuing scholarly archive.

No verified SemantIQ Version DOI or Concept DOI is currently established by the
repository evidence. Placeholder DOI strings are examples only and must not be
used as real identifiers.

---

## 1. Version DOI

A Version DOI identifies one specific archived software release.

If a future SemantIQ release is deposited and receives a Version DOI, a research
paper reproducing that exact archived release should cite that identifier together
with the software version and, where relevant, the Git commit used for execution.

A Git tag, source version, or local metadata file does not itself create a Version
DOI.

---

## 2. Concept DOI

A Concept DOI, where provided by the archive, identifies the software project
across multiple archived versions.

It is useful for project-level references that are not tied to one exact archived
release.

A repository URL or project name must not be represented as a Concept DOI unless an
actual archive record has issued and verified that identifier.

---

## Current citation rule

Until real archive identifiers are verified:

- cite the repository and exact SemantIQ version used;
- record the Git commit SHA for reproducible evaluations;
- use [`CITATION.cff`](../CITATION.cff) as the canonical local citation metadata;
- do not publish `EXAMPLE_VERSION`, `EXAMPLE_CONCEPT`, or any other placeholder
  DOI value as if it were an issued identifier.

See [Citation Guide](CITATION_GUIDE.md) and
[Zenodo GitHub Integration Workflow](ZENODO_DOI_WORKFLOW.md).
