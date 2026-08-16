# question-ambiguity.v1

Stable ID: `question-ambiguity.v1`
Version: `1.0.0`
Purpose: Identify ambiguity in terminology, scope, time, population, domain, claims, output, measurement, audience, and constraints.
Input schema: `{ "question": "string" }`
Output schema: `{ "ambiguities": [{ "type": "string", "severity": "string", "text": "string", "explanation": "string", "suggestion": "string" }] }`
Safety notes: Ask for clarification rather than inventing missing context.
Evaluation fixtures: `question-ambiguity.fixture.json`
Changelog: v1 initial Sprint 2 prompt contract.
