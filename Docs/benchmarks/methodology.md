# Benchmark Methodology & Scoring Rubrics

SemantIQ evaluates AI systems across standardized quality dimensions:

## Quality Dimensions

1. **Reasoning Consistency ($RC$)**: Logical validity and consistency across multi-step execution.
2. **Evidence Grounding ($EG$)**: Direct attribution of claims to observable citations and environment results.
3. **Execution Robustness ($ER$)**: Error handling and graceful degradation under unexpected tool failures.
4. **Recovery Capability ($RCap$)**: Detection and correction of environment exceptions.

## Mathematical Formulation

$$Score_{final} = \sum_{i=1}^n w_i \cdot S_i, \quad \sum_{i=1}^n w_i = 1.0$$
