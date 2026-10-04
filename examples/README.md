# Examples

This directory contains small checked-in examples and fixtures for SemantIQ's current source tree.

These examples are useful for local development, contract validation, and documentation. They are
**not** evidence of external adoption, independent replication, package publication, dataset
publication, or production deployment unless a separate source explicitly establishes that claim.

## Example catalog

| Group | Starting point | Kind | Purpose | Validation / evidence boundary |
| --- | --- | --- | --- | --- |
| [`citation/`](./citation/) | [`datacite.json`](./citation/datacite.json) | Metadata fixture | Illustrates DataCite-shaped citation metadata for SemantIQ software. | The file contains placeholder DOI values and migration-bound historical creator metadata. No direct test of this example file was identified; it must not be treated as evidence of a Zenodo/DataCite deposit or issued DOI. Citation infrastructure is covered separately by `tests/unit/citation-metadata.test.ts`. |
| [`ecosystem/`](./ecosystem/) | [`external-benchmark-pack.json`](./ecosystem/external-benchmark-pack.json) | Synthetic benchmark-pack fixture and registry metadata | Exercises the generic external benchmark-pack contract and registry-query path. | `tests/unit/ecosystem.test.ts` validates the checked-in pack structure and local mapper behavior. This establishes local contract behavior only; it does not establish third-party authorship, upstream benchmark compatibility, independent provenance verification, or external adoption. |
| [`identifiers/`](./identifiers/) | [`benchmark-pack.json`](./identifiers/benchmark-pack.json) | Synthetic artifact-identity metadata | Demonstrates SemantIQ artifact identifiers for benchmark packs, dataset packs, evaluation reports, and software releases. | `tests/unit/persistent-identifiers.test.ts` loads and validates all four checked-in manifests. Values such as example commit hashes, historical alpha.1 release identity, placeholder DOI data, and migration-bound creator names are fixture content rather than current release or external-publication evidence. |
| [`kaggle/`](./kaggle/) | [`semantiq_starter.py`](./kaggle/semantiq_starter.py) | Example code plus local metadata fixture | Demonstrates loading SemantIQ JSONL exports into a pandas DataFrame and includes Kaggle-shaped dataset metadata. | `tests/unit/kaggle.test.ts` verifies local metadata generation and the checked-in files. Official Kaggle-tool validation, authenticated upload, namespace ownership, compatibility, and publication are not established. See `Docs/KAGGLE_GUIDE.md`. |
| [`mvp/`](./mvp/) | [`example-workspace.json`](./mvp/example-workspace.json) | Synthetic workspace fixture | Shows the serialized shape of a local MVP workspace example. | No direct test of this specific file was identified in the current tree. Related local MVP runtime behavior is exercised by `packages/mvp-runtime/tests/mvp-journey.test.ts`, but that does not by itself validate this fixture as an external or production artifact. |

## Evidence rule

Treat each example according to the evidence attached to that example or its directly related test.
A checked-in example demonstrates that the repository contains a representation or local workflow;
it does not automatically demonstrate that an external platform accepted it, that another party
reproduced it, or that the underlying capability is production-ready.
