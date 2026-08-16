# question-relations.v1

Stable ID: `question-relations.v1`
Version: `1.0.0`
Purpose: Suggest semantic relations between questions and knowledge objects.
Input schema: `{ "source": "object", "candidates": ["object"] }`
Output schema: `{ "relations": [{ "sourceId": "string", "targetId": "string", "relation": "string", "confidence": "number", "explanation": "string", "evidence": ["string"] }] }`
Safety notes: Relations require approval unless deterministic internal events created them.
Evaluation fixtures: `question-relations.fixture.json`
Changelog: v1 initial Sprint 2 prompt contract.
