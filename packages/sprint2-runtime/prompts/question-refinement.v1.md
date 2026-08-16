# question-refinement.v1

Stable ID: `question-refinement.v1`
Version: `1.0.0`
Purpose: Generate meaning-preserving refinement variants.
Input schema: `{ "question": "string", "ambiguities": "array", "assumptions": "array" }`
Output schema: `{ "variants": [{ "kind": "string", "refinedText": "string", "changesMade": ["string"], "meaningPreservationNote": "string", "expectedBenefit": "string", "confidence": "number" }] }`
Safety notes: Never overwrite the original question. Require user approval.
Evaluation fixtures: `question-refinement.fixture.json`
Changelog: v1 initial Sprint 2 prompt contract.
