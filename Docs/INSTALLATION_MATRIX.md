# Installation Matrix & Environment Compatibility

This document details verified execution environments, system prerequisites, clean install procedures, and platform limitations for **SemantIQ Benchmarks**.

---

## Supported Environments

| Environment | Supported Status | Node.js | Package Manager | Docker Required? | Notes |
|---|---|---|---|---|---|
| **Linux (GitHub-hosted runner)** | `VERIFIED_IN_REQUIRED_CI` | `22` | `pnpm 11.7.0` | Optional | Required CI baseline |
| **Windows 10/11 (PowerShell/WSL2)** | `BEST_EFFORT` | `>= 22.0.0` | `pnpm 11.7.0` | Optional | Useful instructions exist; not a required CI target |
| **macOS (Apple Silicon & Intel)** | `UNVERIFIED` | `>= 22.0.0` | `pnpm 11.7.0` | Optional | Not exercised by required CI |
| **Docker Container** | `IMPLEMENTED_PARTIAL` | Containerized | Workspace install | Yes | Image/build surfaces exist; live lifecycle is not required CI |
| **Clean Node Environment** | `BEST_EFFORT` | `>= 22.0.0` | `pnpm 11.7.0` | No | Source-checkout path; environment-specific compatibility varies |

---

## Prerequisites

- **Node.js**: Version 22.0.0 or higher (`node -v`)
- **pnpm**: Version 11.7.0 or compatible (`pnpm -v`)
- **Git**: For repository clone (`git --version`)
- **Docker & Docker Compose**: Optional for containerized services (`docker compose version`)

---

## Clean Installation Steps

### 1. Fresh Monorepo Checkout
```bash
git clone https://github.com/Logorythmus-org/Semantiq.git
cd Semantiq
```

### 2. Dependency Installation
```bash
pnpm install --frozen-lockfile
```

### 3. Verification & Doctor Diagnostic
```bash
pnpm doctor
pnpm verify
```

---

## Platform-Specific Limitations

1. **Local Ollama Daemon**:
   - Diagnostics may inspect the conventional `http://localhost:11434` endpoint.
   - Ollama request/response execution and automatic fallback are not implemented or verified.

2. **Docker Compose Profile**:
   - Opt-in real PostgreSQL tests require a compatible database service; they are skipped by the
     default Node test run and are not a required cross-platform compatibility claim.
