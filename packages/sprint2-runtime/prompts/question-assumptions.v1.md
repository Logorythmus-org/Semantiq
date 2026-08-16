# question-assumptions.v1

Stable ID: `question-assumptions.v1`
Version: `1.0.0`
Purpose: Detect possible unstated assumptions without claiming certainty.
Input schema: `{ "question": "string" }`
Output schema: `{ "assumptions": [{ "type": "string", "statement": "string", "explanation": "string", "confidence": "number" }] }`
Safety notes: Use language such as "may assume" and "possible unstated premise".
Evaluation fixtures: `question-assumptions.fixture.json`
Changelog: v1 initial Sprint 2 prompt contract.
