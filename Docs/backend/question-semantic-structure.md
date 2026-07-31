# Question Semantic Structure

## Purpose

`QuestionSemanticStructure` is the explicit semantic boundary owned by the Question Runtime. It records what a creator has stated about a Question. It does not infer meaning, evaluate truth, score quality, answer the Question, or call an AI provider.

## Contract

```json
{
  "context": ["string"],
  "assumptions": ["string"],
  "constraints": ["string"],
  "unknowns": ["string"],
  "uncertainty": {
    "level": "unspecified | low | medium | high",
    "statements": ["string"]
  },
  "scope": {
    "inclusions": ["string"],
    "exclusions": ["string"]
  },
  "perspectives": ["string"],
  "openPossibilities": ["string"]
}
```

The uncertainty level is declared input, not a calculated score. A level other than `unspecified` requires at least one explanatory statement. Scope inclusions and exclusions cannot contain the same normalized statement.

## Bounds

- Every section must be present in a complete replacement request.
- Every list may contain at most 32 statements.
- The full structure may contain at most 128 statements.
- Each normalized statement contains 1 to 500 Unicode characters.
- Duplicate statements inside one list and disallowed control characters are rejected.
- An all-empty structure with `uncertainty.level = unspecified` is valid and means that no semantics have been asserted.

## Lifecycle

The structure is optional and one-to-one with a Question. Creation uses semantic expected version 0 and produces version 1. Replacements use optimistic concurrency, preserve full immutable before/after revisions, and reject normalized no-ops. Semantic versions do not change Question versions.

Only the Question creator may write. Archived Questions preserve current structure and history, allow current reads, and reject writes until restored. There is no semantic delete operation.

## Deferred

Partial patches, item IDs, search, rankings, scores, embeddings, automatic assumption detection, truth judgments, machine suggestions, and Semantiq execution are outside Prompt 4.
