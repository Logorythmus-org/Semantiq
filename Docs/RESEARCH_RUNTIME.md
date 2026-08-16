# Research Runtime

The Research Runtime turns questions into traceable research projects, evidence, hypotheses, experiments, datasets, publications, reviews, communities, collaboration records, tasks, analytics, recommendations, and Knowledge Graph updates.

The runtime composes Core Domain, Graph Runtime, and Semantiq. It does not own storage infrastructure directly.

## Runtime Capabilities

- `createResearch()`
- `createHypothesis()`
- `addEvidence()`
- `createExperiment()`
- `addDataset()`
- `publishResearch()`
- `reviewPublication()`
- `createCommunity()`
- `joinCommunity()`
- `createCollaboration()`
- `assignTask()`
- `recommendResearch()`
- `recommendEvidence()`
- `searchResearch()`
- `analytics()`

## Invariants

- Every research project starts from a question.
- Every research object can become a graph node.
- Evidence keeps provenance.
- Publications link back to research and evidence.
- Recommendations are explainable.
