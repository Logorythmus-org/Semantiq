# SemantIQ Public API Catalog

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  
**Package**: `@tech-club/semantiq`

---

## Public Export Catalog

### 1. Core Engine & Benchmark Primitives

- `LocalSemantiqEngine`: Main local reproducible evaluation engine scaffold.
- `SemanticEvaluationRequest`, `SemanticEvaluationResult`: Basic evaluation interfaces.

### 2. Behavioral Domain Contracts (`behavioral-contracts.ts`)

- `BehavioralStage`: 9 lifecycle stage types (`environment`, `permissions`, `context`, `interpretation`, `decision`, `action`, `result`, `consequence`, `recovery`).
- `BehavioralStageDescriptor`, `BehavioralContractRegistry`.

### 3. Verb Taxonomy (`verb-taxonomy.ts`)

- `VerbFamily`: 7 canonical verb families.
- `VerbTaxonomyRegistry`: Central taxonomy lookup, alias resolver, and verb validator.

### 4. Environment & Permissions (`environment-permissions.ts`)

- `EnvironmentResourceClass`: 14 resource classes.
- `PermissionState`: 10 permission states.
- `evaluatePermission()`, `detectPermissionDrift()`, `redactSecrets()`.

### 5. Event Schema & Evidence Integrity (`event-schema.ts`)

- `CanonicalEventType`: 19 event types.
- `BehavioralEventSchema`, `EventDAGIntegrityAnalyzer`, `EvaluatorAnnotationStore`, `serializeDeterministicEvent()`.

### 6. Execution Graph & Deterministic Replay (`execution-graph.ts`)

- `GraphNodeType` (9 types), `GraphEdgeType` (12 types).
- `BehavioralGraphBuilder`, `DryReplayEngine`, `HumanReadableTraceRenderer`.

### 7. Mission Boundary & Containment Detection (`mission-boundary.ts`)

- `MissionContract`, `ContainmentFailureClass` (13 classes), `ViolationAttribution` (9 categories).
- `MissionBoundaryEvaluator`.

### 8. Consequence & Recovery Evaluation (`consequence-recovery.ts`)

- `DiscoveredConsequence`, `RecoveryMetrics` (12 metrics), `IncidentEvidenceBundle`.
- `ConsequenceEvaluator`.

### 9. Single-Agent Scenario Pack (`scenario-pack.ts`)

- `SingleAgentScenario`, `ScenarioPackEngine`, `ScenarioEvaluationBundle`.
