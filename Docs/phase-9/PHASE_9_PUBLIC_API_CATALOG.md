# Phase 9 Public API Catalog

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Public Export Catalog

All exported types and classes from `@tech-club/semantiq` are exported through `packages/semantiq/src/index.ts`:
- **Domain Objects**: `AgentIdentity`, `AgentRole`, `AgentCapability`, `AgentAuthority`, `AgentMembership`, `CollectiveSession`, `CollectiveMission`, `CollectiveRun`, `Interaction`, `Message`, `Delegation`, `CoordinationState`, `ConsensusState`, `ConflictState`, `ResponsibilityAssignment`, `CollectiveConsequence`, `CollectiveRecovery`, `CollectiveEvidenceBundle`, `CollectiveReplayBundle`.
- **Evaluators & Analyzers**: `MultiAgentDomainEngine`, `AuthorityEvaluator`, `InteractionIntegrityAnalyzer`, `DelegationEvaluator`, `SharedMemoryAnalyzer`, `NegotiationEvaluator`, `ConflictDetectionEngine`, `CollectiveResponsibilityGraphEngine`, `MultiAgentScenarioPackRunner`.
