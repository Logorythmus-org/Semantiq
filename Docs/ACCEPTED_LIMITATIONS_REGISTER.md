# Accepted Alpha Limitations Register

This document registers all accepted limitations for **SemantIQ Benchmarks** Public Alpha Release Candidate.

---

## Limitations Register

| Limitation ID | Feature Area      | Description                                        | User Impact                                                   | Risk Severity             | Workaround                                               | Planned Sprint | Status |
| ------------- | ----------------- | -------------------------------------------------- | ------------------------------------------------------------- | ------------------------- | -------------------------------------------------------- | -------------- | ------ |
| **LIM-01**    | Deployment        | Public Alpha is not production SaaS                | Controlled local deployment only                              | Accepted alpha limitation | Use local CLI or Docker compose                          | Sprint 7+      | Public |
| **LIM-02**    | Federation        | Federation is invitation-only                      | Manual invitation exchange required                           | Accepted alpha limitation | Use two-node alpha profile                               | Sprint 7       | Public |
| **LIM-03**    | Plugin Sandbox    | Local-first plugin sandbox                         | Enable trusted local plugins only                             | Medium                    | Use Safe Mode (`--safe-mode`)                            | Sprint 7       | Public |
| **LIM-04**    | AI Scoring        | LLM scores require human review                    | AI scores are advisory, not absolute truth                    | Accepted alpha limitation | Inspect explanations & rubrics                           | Sprint 7       | Public |
| **LIM-05**    | Legal Compliance  | GDPR & EU AI Act materials are preparation reports | Operators require legal review prior to deployment            | Accepted alpha limitation | Use reports as preparation guides                        | Sprint 7+      | Public |
| **LIM-06**    | Hardware Variance | Host physical variance affects execution timing    | Benchmark timing and provider latency may vary across clouds  | Low                       | Latency decomposed via $PVS$ / $PEP$ mathematical models | Phase 12       | Public |
| **LIM-07**    | Local Isolation   | Local daemon isolation depends on host OS          | Rootless isolation is bounded by host kernel/container engine | Medium                    | Run MicroVMs or `--safe-mode` for untrusted scenarios    | Phase 12       | Public |
| **LIM-08**    | Subsystem Status  | Subsystem gate pass is not product authorization   | Sandbox subsystem PASS verifies contracts only                | Low (Governance)          | Product release governed strictly by Phase 11/12 gates   | Phase 12       | Public |

---

## Maintenance Policy

Known limitations are reviewed prior to every release and published transparently in `Docs/KNOWN_LIMITATIONS.md`.
