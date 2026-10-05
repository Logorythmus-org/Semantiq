# System Architecture

**Status**: `NORMATIVE INDEX`  
**Target Audience**: Developers, Architects, Contributors  

---

## Overview

SemantIQ is structured as a three-tier decoupled pipeline:
$$\text{Benchmark Engine} \longrightarrow \text{Evidence Engine} \longrightarrow \text{Research Workbench}$$

---

## Documents in this Section

- 📐 **[System Architecture](../ARCHITECTURE.md)** (`NORMATIVE`): Architectural specification of Benchmark Engine, Evidence Engine, and Research Workbench.
- 📦 **[Legacy Bounded Context Map](../BOUNDED_CONTEXTS.md)** (`HISTORICAL / MIGRATION-BOUND`): Preserved broader platform domain map; not the current authoritative SemantIQ package inventory.
- 🌐 **[Dual-Language SDK Strategy](dual-language-sdk-strategy.md)** (`REVIEWED`): Cross-language contract synchronization between TypeScript (`@semantiq/sdk`) and Python (`semantiq`).
- 🏗️ **[Core Domain Model](../DOMAIN_MODEL.md)** (`NORMATIVE`): Immutable types for Runs, Traces, Observations, Contrasts, Claims, and Manifests.
