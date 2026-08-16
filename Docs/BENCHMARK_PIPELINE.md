# Benchmark Pipeline

The Semantiq pipeline is modular. Each stage receives a benchmark subject, context, profile, and prior stage outputs.

## Stages

Input -> Semantic Parsing -> Intent Analysis -> Context Analysis -> Knowledge Extraction -> Reasoning Analysis -> Evidence Analysis -> Creativity Analysis -> Consistency Analysis -> Scientific Potential -> Ethical Review -> Explainability -> Confidence Estimation -> Semantic Report -> Historical Comparison -> Recommendations.

## Stage Rules

- Stages are independently replaceable.
- Stage outputs are versioned.
- Failed stages produce explainable warnings, not hidden score changes.
- Offline evaluation can run with locally available context.
- Distributed evaluation is a future adapter concern.
