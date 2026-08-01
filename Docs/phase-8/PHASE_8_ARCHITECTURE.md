# Phase 8 Architecture Overview

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## System Components

1. **Behavioral Domain Contracts** (`behavioral-contracts.ts`): 9-stage lifecycle model.
2. **Verb-Centered Taxonomy** (`verb-taxonomy.ts` & `verb-taxonomy.json`): 44 canonical verbs across 7 families.
3. **Environment & Permission Model** (`environment-permissions.ts`): 14 resource classes, default deny, drift detection, secret redaction.
4. **Event Schema & Evidence DAG** (`event-schema.ts`): 19 event types, DAG analyzer, SHA-256 evidence integrity, separated evaluator annotations.
5. **Execution Graph & Replay Engine** (`execution-graph.ts`): 9 node types, 12 edge types, dry replay engine.
6. **Mission Boundary Evaluator** (`mission-boundary.ts`): Mission contract enforcement, 13 containment failure classes.
7. **Consequence & Recovery Engine** (`consequence-recovery.ts`): 13 lifecycle entities, 12 recovery metrics, incident evidence bundles.
8. **Synthetic Scenario Pack** (`scenario-pack.ts` & `single-agent-scenarios.json`): 12 local, synthetic, offline-capable single-agent scenarios.
