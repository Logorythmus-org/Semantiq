# Quick Start Guide

Welcome to **SemantIQ**, Behavioral Evidence Infrastructure for AI Systems.

This source-checkout path produces one deterministic local result without relying on an npm or
PyPI publication.

## 1. Install from source

Clone the repository and install its locked dependencies:

```bash
git clone https://github.com/Logorythmus-org/Semantiq.git
cd Semantiq
pnpm install --frozen-lockfile
```

Setup and download time depends on the network and checkout size. It is separate from the
time-to-first-result after dependencies are available; this guide does not promise a five-minute
wall-clock setup.

You can check the local environment independently:

```bash
pnpm doctor
```

## 2. Generate your first result

Run the canonical source-checkout command:

```bash
pnpm first-result
```

On success, the command prints the generated path and writes:

`artifacts/first-result/semantiq-result.json`

The generated `artifacts/` directory is ignored by Git and remains local to the checkout.

## 3. How to interpret your first result

The JSON file contains:

- the SemantIQ release version, Public Alpha maturity, and compatible product-contract schema
  version;
- deterministic run metadata and the existing local scaffold result;
- an evidence classification of `internal`, `synthetic`, and
  `not-independent-replication`;
- explicit limitations that travel with the result.

This demonstrates that the checked-out source can execute the deterministic local SemantIQ
scaffold and persist a parseable result. It does **not** demonstrate external replication,
benchmark validation, scientific validation, certification, adoption, production evidence, or
production usage. Production scoring logic is not implemented in this scaffold.

The artifact omits the runtime-generated report ID and timestamp so repeated runs with the same
source and fixture produce identical JSON bytes. No network access or external evidence is used by
the first-result command.

## 4. Continue exploring

- Review the [version and release policy](VERSIONING_POLICY.md) before interpreting software and
  schema versions.
- Read the [Public Alpha evidence boundary](../README.md#evidence-status) before making claims from
  repository-controlled results.
- Use the [documentation index](DOCUMENTATION_INDEX.md) to find SDK, API, benchmark, and evidence
  references. Those references are not package-publication claims.
