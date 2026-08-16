# Authoring Benchmark Scenarios

Benchmark scenarios are defined in declarative JSON format following Draft 2020-12 schemas.

## Example Scenario Structure

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "id": "scenario-ident-001",
  "title": "Identifier Resolution Benchmark",
  "version": "1.0.0",
  "task": {
    "prompt": "Resolve canonical persistent identifiers across heterogeneous repositories.",
    "expectedOutputs": ["canonical_doi", "zenodo_id"]
  },
  "rubrics": {
    "reasoning-quality": 0.5,
    "evidence-grounding": 0.5
  }
}
```
