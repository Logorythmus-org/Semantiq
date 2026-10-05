# SemantIQ Wiki

> **Source-of-truth note:** This Wiki is navigational and explanatory. If a Wiki page conflicts with a reviewed, version-controlled SemantIQ repository artifact, the repository artifact is authoritative.

SemantIQ is **Behavioral Evidence Infrastructure for AI Systems**.

The project is currently **Public Alpha (Experimental)**. It is intended for technical evaluation, local experimentation, reproducible research workflows, and evidence-oriented collaboration. It is not presented as production-ready, independently validated at ecosystem scale, or as a certification authority.

## Start here

- [Repository README](https://github.com/Logorythmus-org/Semantiq)
- [Community Hub](https://github.com/Logorythmus-org/Semantiq/blob/main/COMMUNITY.md)
- [Installation Matrix](https://github.com/Logorythmus-org/Semantiq/blob/main/Docs/INSTALLATION_MATRIX.md)
- [CLI Usage](https://github.com/Logorythmus-org/Semantiq/blob/main/Docs/CLI_USAGE.md)
- [Python Usage](https://github.com/Logorythmus-org/Semantiq/blob/main/Docs/PYTHON_USAGE.md)
- [TypeScript SDK](https://github.com/Logorythmus-org/Semantiq/blob/main/Docs/TYPESCRIPT_SDK.md)
- [HTTP API Reference](https://github.com/Logorythmus-org/Semantiq/blob/main/Docs/HTTP_API_REFERENCE.md)
- [Known Limitations](https://github.com/Logorythmus-org/Semantiq/blob/main/Docs/KNOWN_LIMITATIONS.md)

## Version identity

Keep these identities separate:

- SemantIQ software: `0.1.0-alpha.2`
- Python distribution spelling: `0.1.0a2`
- contract/payload schemas: `1.0.0`
- HTTP route family: `/api/v1`

A schema or API version of `1.0.0` does not mean SemantIQ software itself has reached a stable `1.0.0` release.

## Core map

SemantIQ currently organizes its work around three broad subsystems:

1. **Benchmark Engine** — execution, traces, metrics, and benchmark workflows.
2. **Evidence Engine** — matched contrasts, robustness, evidence graphs, and decision-policy artifacts.
3. **Research Workbench** — claims, preregistration, review gates, research bundles, and replication workflows.

For exact implemented state, follow repository documentation and code rather than this summary.

## Learn by task

### I want to run SemantIQ

Start with the installation matrix and CLI usage. For language-specific integration, use the Python or TypeScript guides.

### I want to understand the evidence model

Read:

- Scientific Guardrails
- Research Workflow
- Known Limitations
- evidence/research documentation

Preserve these distinctions when discussing results:

- observation is not inference;
- matched association is not automatically causal effect;
- absence is not counterevidence;
- owner-controlled reproducibility is not independent external replication.

### I want to reproduce a result

Use the repository reproduction walkthrough and record the exact revision, environment, commands, configuration, artifacts, and divergences.

Independent third-party attempts can be submitted through the Independent Replication Report issue form.

### I want to contribute

Use the Community Hub and CONTRIBUTING guide.

Good first contributions can include:

- clean-environment quickstart validation;
- documentation corrections;
- compatibility observations;
- bounded examples;
- focused regression tests.

Architecture, benchmark semantics, scoring/evidence logic, governance, security-sensitive behavior, and breaking contracts use the Core contribution path.

## Community spaces

- **Discussions** — questions, ideas, experience reports, and early proposals.
- **Projects** — current coordination and contribution opportunities.
- **Issues** — bounded defects, tasks, proposals, reports, and RFC entrypoints.
- **Pull Requests** — reviewed repository changes.

Participation or discussion does not itself establish adoption, implementation, release status, or external validation.

## Security and conduct

Do not publish credentials, private data, proprietary prompts, confidential datasets, or vulnerability details in public spaces.

Follow the repository Security Policy and Code of Conduct.
