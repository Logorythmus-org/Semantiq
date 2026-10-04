# Known Limitations

SemantIQ `0.1.0-alpha.2` is a **Public Alpha (Experimental)** release. This document is the canonical public limitations statement for the current software identity. It replaces phase-, sprint-, and prompt-specific limitation reports.

## Validation boundary

- Independent third-party audit and external replication are **not yet established**.
- Owner-controlled CI, local execution, and clean-room exercises are internal validation only; they are not independent replication.
- Production-scale reliability, ecosystem-scale governance, and real-world adoption are not established.
- Public benchmark exposure may reveal failure modes, gaming strategies, and operational behavior not observed in internal validation.

## Scientific boundary

- SemantIQ is not a certification authority and does not establish universal truth about a model or system.
- Matched contrasts, robustness checks, evidence promotion, governance approval, and bundle integrity do not by themselves establish causality or truth.
- Evaluation outcomes depend on the exact model version, provider/runtime conditions, prompts, parameters, adapters, fixtures, timestamps, and execution environment.
- External submissions do not become verified external evidence until provenance, independence, and eligibility are reviewed.

## Runtime and integration boundary

- Docker Engine execution is implemented with partial live-daemon validation.
- OCI contracts are available, while compatibility with Podman, MicroVMs, and named cloud-provider runtimes is not established unless explicitly documented.
- Local isolation depends on the host operating system, container engine, and security controls.
- Remote-provider operation requires user-supplied credentials and may introduce provider-specific availability, routing, latency, and reproducibility limits.

## Release boundary

- Public Alpha is intended for technical evaluation, local experimentation, and reproducible research workflows.
- It is not presented as production-ready, as a stable public standard, or as a production SLA service.
- Contract, schema, API, benchmark, or documentation version `1.0.0` does not imply a stable SemantIQ software release. The current software identity remains `0.1.0-alpha.2`.

## Maintenance

This file is the public canonical limitations surface. New limitations must be added here or to a directly linked normative subsystem document. Internal prompt reports, sprint reports, completion reports, handoff files, or phase-specific authorization artifacts must not be used as public limitation sources.
