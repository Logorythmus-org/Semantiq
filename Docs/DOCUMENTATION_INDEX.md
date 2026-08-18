# SemantIQ Master Documentation Index

**Milestone**: SemantIQ Behavioral Evidence Infrastructure 1.0.0  
**Status**: `NORMATIVE`  
**License**: [CC-BY-4.0](file:///c:/Users/Kaveh/Desktop/Tech-Club/LICENSING.md)  

Welcome to the **SemantIQ Behavioral Evidence Infrastructure** documentation platform.

---

## 🧭 Audience Navigation Paths

```
                           ┌───────────────────────────────┐
                           │   SemantIQ Documentation Hub  │
                           └──────────────┬────────────────┘
                                          │
    ┌───────────────────────────┬─────────┴─────────┬───────────────────────────┐
    ▼                           ▼                   ▼                           ▼
┌──────────────┐      ┌──────────────────┐  ┌──────────────┐      ┌────────────────────────┐
│  🧑‍💻 Users   │      │  🛠️ Developers   │  │🔬 Researchers│      │  🤝 Partners & Insts   │
│ & Evaluators │      │  & Integrators   │  │& Statisticians│     │  & Replication Hubs    │
└──────────────┘      └──────────────────┘  └──────────────┘      └────────────────────────┘
```

### 🧑‍💻 1. For Users & Evaluators
- 🚀 **[Getting Started](getting-started/README.md)**: [Quick Start](QUICK_START.md) • [Installation Matrix](INSTALLATION_MATRIX.md) • [Offline Guide](OFFLINE_GUIDE.md) • [FAQ](FAQ.md)
- 🧪 **[Benchmarks & Test Batteries](benchmarks/README.md)**: Benchmark Engine • SMF • HACS Long-Horizon • Anti-Gaming Protocols
- 💻 **[CLI Usage Reference](CLI_USAGE.md)**: `doctor` • `patterns` • `evidence` • `claims` • `reviews` • `studies` • `bundles` • `serve`

### 🛠️ 2. For Developers & System Integrators
- 📐 **[System Architecture](architecture/README.md)**: [Architecture Specification](ARCHITECTURE.md) • [Package Boundaries](BOUNDED_CONTEXTS.md) • [Dual-Language SDK Strategy](architecture/dual-language-sdk-strategy.md) • [Core Domain Model](DOMAIN_MODEL.md)
- 🐍 **[Python SDK Guide (`semantiq`)](PYTHON_USAGE.md)**: Python dataclasses, controlled language validation, and study protocols
- 📘 **[TypeScript SDK Guide (`@semantiq/sdk`)](TYPESCRIPT_SDK.md)**: Zero-UI client, contract fixtures, and Bootstrap CI evaluation
- 🌐 **[Headless HTTP API Reference](HTTP_API_REFERENCE.md)**: REST endpoints (`/health`, `/info`, `/api/v1/...`)
- 🏛️ **[Product Domain Governance](governance/README.md)**: [Governance Model](GOVERNANCE.md) • [RFC Process](governance/rfc_process.md) • [CODEOWNERS](../.github/CODEOWNERS)
- 🔒 **[Security & Protection](security/README.md)**: [Security Policy](../SECURITY.md) • [Threat Model](security/threat_model.md) • [Data Handling](security/data_handling.md) • [GitHub Protection](security/github_repository_protection.md)
- 📐 **[Architecture Decision Records (ADRs)](adr/README.md)**: Immutable record of system design decisions

### 🔬 3. For Researchers & Data Scientists
- 🛡️ **[Core Scientific Concepts](concepts/README.md)**: [16 Epistemic Invariants](SCIENTIFIC_GUARDRAILS.md) • [Controlled Language Rules](../trust/PROHIBITED_PUBLIC_CLAIMS.md) • [Pattern-Failure Taxonomy](DOMAIN_MODEL.md)
- 📊 **[Evidence Engine](evidence/README.md)**: 7D Matched Controls • Bootstrap CI & Exact Sign Test • Robustness & Specification Curves • Evidence Graph
- 🔬 **[Research Workbench & Governed Claims](research/README.md)**: [18-Stage Research Reference Workflow](RESEARCH_WORKFLOW.md) • Governed Claims • Proposal-Only Evidence Watch • Merkle Research Bundles

### 🤝 4. For Partners, Institutions & Replication Hubs
- 📑 **[Partner Protocols & Exchange](partners/README.md)**: Pre-registration • Execution Manifests • External Evidence Eligibility Gate • Cross-Org Replication
- ⚖️ **[Licensing & Intellectual Property](../LICENSING.md)**: Multi-tier licensing (MIT code, CC0 datasets/prompts, CC-BY-4.0 docs)
- 🏷️ **[Versioning & Release Policy](VERSIONING_POLICY.md)**: SemVer rules, schema stability, and benchmark preservation
- 📋 **[Release Readiness Audit](release/core_product_readiness.md)**: 19-dimension audit report for the Headless Milestone

---

## 🗂️ Scalable Documentation Directory Structure

```text
Docs/
├── getting-started/      # Quickstart, installation, offline usage, FAQ
├── concepts/             # Epistemic invariants, scientific guardrails, taxonomy
├── architecture/         # Three-tier design, package boundaries, dual-SDK strategy
├── benchmarks/           # Benchmark Engine, SMF, HACS, Vision, anti-gaming
├── evidence/             # Statistical contrast, 7D matching, robustness diagnostics
├── research/             # 18-stage reference pipeline, governed claims, bundles
├── governance/           # Product-domain ownership, RFC process, dispute protocol
├── partners/             # Pre-registration, execution manifests, eligibility gate
├── api/                  # Headless HTTP API, REST endpoints, CLI reference
├── sdk/                  # Python and TypeScript SDK guides and parity tests
├── security/             # Threat model, data handling, repository protection
├── releases/             # Versioning policy, readiness audits, checksums
└── adr/                  # Architecture Decision Records
```

---

## 🏷️ Document Status Classifications

Every documentation artifact in this repository carries an explicit status:
- **`NORMATIVE`**: Authoritative, binding product specifications, mathematical contracts, and security policies.
- **`REVIEWED`**: Technical guides, walkthroughs, and developer tutorials verified against current codebase.
- **`DRAFT`**: Active RFCs and preliminary specifications undergoing community review.
- **`HISTORICAL`**: Archived records, pre-headless audit reports, and legacy migration logs preserved for provenance.
