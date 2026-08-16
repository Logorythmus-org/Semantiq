# question-intent.v1

Stable ID: `question-intent.v1`
Version: `1.0.0`
Purpose: Detect one or more question intents with confidence and explanation.
Input schema: `{ "question": "string", "context": "object" }`
Output schema: `{ "intents": [{ "type": "string", "confidence": "number", "explanation": "string", "triggers": ["string"], "suggestedNextAction": "string" }] }`
Safety notes: Do not infer sensitive traits. Preserve uncertainty.
Evaluation fixtures: `question-intent.fixture.json`
Changelog: v1 initial Sprint 2 prompt contract.
