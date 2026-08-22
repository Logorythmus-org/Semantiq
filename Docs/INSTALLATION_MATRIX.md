# Installation Matrix & Environment Compatibility

This document details verified execution environments, system prerequisites, clean install procedures, and platform limitations for **SemantIQ Benchmarks**.

---

## Supported Environments

| Environment | Supported Status | Node.js | Package Manager | Docker Required? | Notes |
|---|---|---|---|---|---|
| **Linux (Ubuntu 22.04+)** | Fully Supported | `>= 22.0.0` | `pnpm 11.7.0` | Optional | Baseline CI environment |
| **Windows 10/11 (PowerShell/WSL2)** | Fully Supported | `>= 22.0.0` | `pnpm 11.7.0` | Optional | Native PowerShell & WSL2 verified |
| **macOS (Apple Silicon & Intel)** | Fully Supported | `>= 22.0.0` | `pnpm 11.7.0` | Optional | Verified on macOS 14+ |
| **Docker Container** | Fully Supported | Containerized | Pre-packaged | Yes | Clean isolated execution |
| **Clean Node Environment** | Fully Supported | `>= 22.0.0` | `pnpm` / `npm` | No | Zero external system dependencies |

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
pnpm install
```

### 3. Verification & Doctor Diagnostic
```bash
pnpm doctor
pnpm verify
```

---

## Platform-Specific Limitations

1. **Local Ollama Daemon**:
   - Local LLM execution via Ollama requires Ollama daemon running on `http://localhost:11434`.
   - If Ollama is unavailable, SemantIQ automatically falls back to deterministic mock evaluation.

2. **Docker Compose Profile**:
   - Database integration tests require Docker Desktop or daemon running when exercising PostgreSQL real tests (`VERIFY_DOCKER=1`).
