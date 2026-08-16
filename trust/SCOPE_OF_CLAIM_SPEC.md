# Scope of Claim Specification

**Version**: 1.0.0  
**Date**: 2026-08-04  

---

## Required Scope Block Fields

Every published evaluation score or benchmark result must include an explicit Scope of Claim metadata block:

- `modelId`: Unique identifier of the model
- `modelVersion`: Precise model version or revision string
- `provider`: Model provider or runner host
- `executionTimestamp`: ISO-8601 execution date and time
- `benchmarkVersion`: SemantIQ benchmark version
- `scenarioVersion`: Scenario pack version
- `evaluatorVersion`: Evaluator engine version
- `configuration`: Runtime parameters (e.g. temperature, max tokens)
- `enabledTools`: List of tools accessible during evaluation
- `language`: Primary evaluation language
- `repetitionCount`: Number of evaluation runs
- `variance`: Statistical variance / confidence interval
- `knownExclusions`: Explicitly excluded domains or modalities
- `scope`: Boundaries of validity
- `prohibitedInterpretations`: Explicit forbidden inferences
- `uncertaintyStatement`: Statement of measurement error / bounds
