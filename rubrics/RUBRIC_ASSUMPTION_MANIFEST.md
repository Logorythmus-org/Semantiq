# Rubric Assumption Manifest Specification

**Version**: 1.0.0  
**Date**: 2026-08-06

---

## Required Metadata Fields

Every rubric used in SemantIQ must include a machine-readable `RubricAssumptionManifest`:

- `rubricId`: Unique identifier
- `constructName`: Target construct measured
- `operationalDefinition`: Precise definition of scoring criteria
- `intendedUse`: Declared scope of application
- `excludedInterpretations`: Inferences prohibited by this rubric
- `linguisticAssumptions`: Language dependencies
- `culturalAssumptions`: Cultural context assumptions
- `philosophicalAssumptions`: Epistemological or logical assumptions
- `accessibilityAssumptions`: Screen reader & format assumptions
- `targetPopulation`: Intended model class
- `knownDisagreements`: Documented debate points
- `alternativeRubrics`: Parallel rubrics measuring same dimension
- `version`: Version string
