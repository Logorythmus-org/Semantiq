# question-tags.v1

Stable ID: `question-tags.v1`
Version: `1.0.0`
Purpose: Suggest explainable semantic tags across domain, intent, method, difficulty, audience, research stage, evidence need, risk, language, project suitability, and education suitability.
Input schema: `{ "question": "string", "analysis": "object" }`
Output schema: `{ "tags": [{ "label": "string", "category": "string", "confidence": "number", "explanation": "string", "source": "string", "version": "string" }] }`
Safety notes: Tags are suggestions and must be editable/rejectable.
Evaluation fixtures: `question-tags.fixture.json`
Changelog: v1 initial Sprint 2 prompt contract.
