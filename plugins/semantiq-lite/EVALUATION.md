# Evaluation protocol: semantiq-lite-evaluation/0.2.0

Status: protocol and synthetic harness foundations; no human corpus collected.
Synthetic fixtures must never be presented as human annotation or held-out results.

Before semantic evaluation, recruit independent annotators for at least 50 claims
from at least 10 source documents, including English, Persian, mixed language,
negative, contradictory, unsupported and ambiguous examples. Record consent and
redistribution eligibility outside the evidence payload as appropriate.

Freeze raw bytes, SHA-256, canonical snapshots, extractor versions, source IDs,
claim records, exact anchor coordinates, expected integrity labels, semantic labels,
annotator identities and disagreement/adjudication records in a versioned manifest.
Group preprints, revisions, translations and related publications into document
families **before** splitting. Assign whole families to development or held-out
evaluation; no family, source revision or annotation may cross the split.
Keep held-out labels inaccessible to rule development. Freeze the split seed,
manifest digest, evaluator revision and environment before the evaluation run.

Citation integrity evaluates source identity, raw and text hashes, exact quote,
offsets and graph references together. Count accepted valid links, rejected valid
links, accepted invalid links and rejected invalid links. Report precision and recall
with denominators and undefined values when no relevant predictions exist.
Fabricated-anchor acceptance must be zero within the acceptance suite. Mutation
regressions must change quote, offsets, source ID, source bytes and hashes separately.

Semantic support precision is independently defined as human-supported predictions
divided by all `SUPPORTED_BY_SOURCE` predictions. Report recall against all
human-supported claims, abstentions over all eligible claims, per-language and
per-error-class counts, disagreements, confidence intervals, runtime and peak resource
costs. The initial 90% precision target is unmeasured and not a PR A gate.
No semantic predictions are produced by PR A; precision is therefore undefined.
Never combine citation integrity and semantic metrics into a truth score.

The `examples` directory freezes a small synthetic source and valid/invalid reviews.
`test_frozen_examples` loads raw bytes, verifies the valid graph and expects
`ANCHOR_MISMATCH` for the fabricated quote. The broader mutation tests provide the
deterministic validator harness. These are development fixtures, not the future
document-family-separated held-out corpus. A later evaluation runner must enforce
manifest hashes and family separation before reading prediction labels.
