# System Architecture

**Status**: `NORMATIVE`  
**Target Audience**: Developers, Architects, Contributors  

---

## Overview

SemantIQ is structured as a three-tier decoupled pipeline:
$$\text{Benchmark Engine} \longrightarrow \text{Evidence Engine} \longrightarrow \text{Research Workbench}$$

---

## Documents in this Section

- 📐 **[System Architecture](../ARCHITECTURE.md)** (`NORMATIVE`): Architectural specification of Benchmark Engine, Evidence Engine, and Research Workbench.
- 📦 **[Package Boundaries & Layering](../BOUNDED_CONTEXTS.md)** (`NORMATIVE`): Strict monorepo package isolation rules (core domain never imports from application services).
- 🌐 **[Dual-Language SDK Strategy](dual-language-sdk-strategy.md)** (`REVIEWED`): Cross-language contract synchronization between TypeScript (`@semantiq/sdk`) and Python (`semantiq`).
- 🏗️ **[Core Domain Model](../DOMAIN_MODEL.md)** (`NORMATIVE`): Immutable types for Runs, Traces, Observations, Contrasts, Claims, and Manifests.
