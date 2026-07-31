# Accepted Alpha Limitations Register

This document registers all accepted limitations for **SemantIQ Benchmarks** Public Alpha Release Candidate.

---

## Limitations Register

| Limitation ID | Feature Area | Description | User Impact | Risk Severity | Workaround | Planned Sprint | Status |
|---|---|---|---|---|---|---|---|
| **LIM-01** | Deployment | Public Alpha is not production SaaS | Controlled local deployment only | Accepted alpha limitation | Use local CLI or Docker compose | Sprint 7+ | Public |
| **LIM-02** | Federation | Federation is invitation-only | Manual invitation exchange required | Accepted alpha limitation | Use two-node alpha profile | Sprint 7 | Public |
| **LIM-03** | Plugin Sandbox | Local-first plugin sandbox | Enable trusted local plugins only | Medium | Use Safe Mode (`--safe-mode`) | Sprint 7 | Public |
| **LIM-04** | AI Scoring | LLM scores require human review | AI scores are advisory, not absolute truth | Accepted alpha limitation | Inspect explanations & rubrics | Sprint 7 | Public |
| **LIM-05** | Legal Compliance | GDPR & EU AI Act materials are preparation reports | Operators require legal review prior to deployment | Accepted alpha limitation | Use reports as preparation guides | Sprint 7+ | Public |

---

## Maintenance Policy

Known limitations are reviewed prior to every release and published transparently in `Docs/KNOWN_LIMITATIONS.md`.
