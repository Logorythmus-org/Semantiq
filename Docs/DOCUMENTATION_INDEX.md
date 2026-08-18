# Master Documentation Index

Welcome to the **SemantIQ Behavioral Evidence Infrastructure** documentation platform.

---

## 1. Product Architecture & Core Infrastructure

- 📐 **[System Architecture](ARCHITECTURE.md)**: Deep dive into Benchmark Engine, Evidence Engine, and Research Workbench.
- 🔬 **[Canonical Research Workflow](RESEARCH_WORKFLOW.md)**: 18-stage end-to-end evidence reference pipeline (`DP-008 → FP-002`).
- 🛡️ **[Scientific Guardrails & Epistemic Invariants](SCIENTIFIC_GUARDRAILS.md)**: The 16 core epistemic boundaries, controlled language rules, and eligibility gating.
- 📦 **[Package Boundaries](BOUNDED_CONTEXTS.md)**: Monorepo package dependency structure.
- 🏗️ **[Core Domain Model](DOMAIN_MODEL.md)**: Runs, Traces, Observations, Contrasts, Claims, and Protocols.

---

## 2. Developer Guides & SDK Usage

- 🐍 **[Python Usage Guide](PYTHON_USAGE.md)**: `semantiq` Python SDK installation, statistical contrast, and claims workflow.
- 📘 **[TypeScript SDK Guide](TYPESCRIPT_SDK.md)**: `@semantiq/sdk` TypeScript client and contract fixtures.
- 💻 **[CLI Usage Guide](CLI_USAGE.md)**: `semantiq` CLI commands (`doctor`, `patterns`, `evidence`, `claims`, `reviews`, `studies`, `serve`).
- 🌐 **[Headless HTTP API Reference](HTTP_API_REFERENCE.md)**: REST API endpoints reference (`/health`, `/info`, `/api/v1/...`).
- 📖 **[Quick Start Guide](QUICK_START.md)**: Getting started in under 5 minutes.
- 💻 **[Installation Matrix](INSTALLATION_MATRIX.md)**: System requirements, platform support, and Docker setup.
- 🔒 **[Offline Guide](OFFLINE_GUIDE.md)**: Zero-telemetry posture and `--safe-mode` usage.
- 🌐 **[Remote Provider Guide](REMOTE_PROVIDER_GUIDE.md)**: OpenAI, Anthropic, and Google GenAI connector setup.
- 🔬 **[Reproduction Walkthrough](REPRODUCTION_WALKTHROUGH.md)**: Step-by-step score reproduction.
- ❓ **[FAQ](FAQ.md)**: Frequently asked questions.

---

## 3. Quality, Security & Privacy Audits

- ♿ **[Accessibility Audit](ACCESSIBILITY_REPORT.md)**: WCAG 2.2 Level AA compliance audit.
- ⚡ **[Performance Baseline](PERFORMANCE_REPORT.md)**: Runtime and latency profiling.
- 🛡️ **[Security Audit](SECURITY_REPORT.md)**: Dependency and secret scanning audit.
- 🕵️ **[Privacy Audit](PRIVACY_REPORT.md)**: Network egress and data residency verification.
- 🧹 **[Repository Hygiene](REPOSITORY_HYGIENE_REPORT.md)**: Cleanliness and ignore rules verification.
- 📋 **[Consolidated Remediation Register](CONSOLIDATED_REMEDIATION_REGISTER.md)**: Quality pass register.

---

## 4. Multi-Perspective Audits & Release Readiness

- 👥 **[Stakeholder Audit Reports](STAKEHOLDER_AUDIT_REPORTS.md)**: 9 stakeholder role audits.
- 🔄 **[Reproduction Attempt Report](REPRODUCTION_ATTEMPT_REPORT.md)**: Independent score reproduction test.
- ✅ **[Public Claims Verification](PUBLIC_CLAIMS_VERIFICATION_REPORT.md)**: 100% claims verification against code.
- ⚠️ **[Misuse & Failure Scenarios](MISUSE_AND_FAILURE_SCENARIOS_REPORT.md)**: Error recovery and prompt injection tests.
- 📋 **[Findings Register](FINDINGS_REGISTER.md)**: Master audit findings matrix.
- 🛑 **[Release Blocker List](RELEASE_BLOCKER_LIST.md)**: 0 open release blockers tracking.
- 📊 **[Multi-Perspective Audit Matrix](MULTI_PERSPECTIVE_AUDIT_MATRIX.md)**: Signed-off audit matrix.

---

## 5. Persistent Identifiers, Citation & IP

- 🏷️ **[Persistent Identifiers Strategy](PERSISTENT_IDENTIFIERS.md)**: Canonical `semantiq:<type>:<slug>:<version>` specification.
- 🆔 **[Artifact Identity Model](ARTIFACT_IDENTITY_MODEL.md)**: Formal identity separation.
- 📜 **[Citation Guide](CITATION_GUIDE.md)**: BibTeX & APA citation guidelines.
- 📑 **[Zenodo DOI Workflow](ZENODO_DOI_WORKFLOW.md)**: GitHub to Zenodo archiving pipeline.
- ⚖️ **[Intellectual Property Framework](INTELLECTUAL_PROPERTY_FRAMEWORK.md)**: IP, copyright, and provenance rights.
- 📝 **[Contributor License Agreement](CONTRIBUTOR_LICENSE_AGREEMENT.md)**: Developer Certificate of Origin (DCO 1.1).

---

## 6. Release Reports & Handoffs

- 🚀 **[Final Release Candidate Report](FINAL_RELEASE_CANDIDATE_REPORT.md)**: Release candidate verification.
- 🚥 **[Formal Go/No-Go Decision](GO_NO_GO_DECISION.md)**: **GO** verdict signed off.
- 📦 **[Artifact Checksums](ARTIFACT_CHECKSUMS.md)**: SHA-256 release file checksums.
- 🤝 **[Phase 7 Handoff](PHASE_7_HANDOFF.md)**: Publication execution guide.
