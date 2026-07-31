# semantiq-question.v1

Stable ID: `semantiq-question.v1`
Version: `1.0.0`
Purpose: Evaluate a question using the Sprint 2 Semantiq dimensions with explanations for every score.
Input schema: `{ "question": "string", "analysis": "object", "profile": "object" }`
Output schema: `{ "scores": [{ "dimensionId": "string", "score": "number", "level": "string", "explanation": "string", "observations": ["object"], "weaknesses": ["string"], "improvementSuggestions": ["string"], "confidence": "number", "evaluationVersion": "string" }] }`
Safety notes: No score may exist without explanation. Do not hide model/provider usage.
Evaluation fixtures: `semantiq-question.fixture.json`
Changelog: v1 initial Sprint 2 prompt contract.
