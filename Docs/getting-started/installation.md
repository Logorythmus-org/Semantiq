# Installation & Environment Setup

## Prerequisites

- **Node.js**: >= 22.0.0 (LTS recommended)
- **pnpm**: >= 9.0.0 (`corepack enable pnpm`)
- **Git**: >= 2.30.0
- **Optional**: Docker / Podman (for isolated container sandbox execution)

## Step-by-Step Installation

```bash
# Clone the canonical repository
git clone https://github.com/Logorythmus-org/Semantiq.git
cd Semantiq

# Install dependencies using frozen lockfile
pnpm install --frozen-lockfile

# Verify system health
pnpm doctor
```

## Verifying Local Privacy Posture

SemantIQ is designed local-first. By default, zero telemetry is transmitted. To verify:

```bash
npx tsx tools/automation/cli.mjs preflight
```
