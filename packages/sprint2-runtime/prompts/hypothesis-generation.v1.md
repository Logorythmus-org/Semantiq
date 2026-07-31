# hypothesis-generation.v1

Stable ID: `hypothesis-generation.v1`
Version: `1.0.0`
Purpose: Generate testable hypothesis candidates from question, project, evidence, and assumptions.
Input schema: `{ "question": "string", "project": "object", "evidence": ["object"], "assumptions": ["object"] }`
Output schema: `{ "hypotheses": [{ "statement": "string", "variables": ["string"], "expectedObservations": ["string"], "testability": "number", "confidence": "number" }] }`
Safety notes: Include alternative and null hypothesis options where relevant.
Evaluation fixtures: `hypothesis-generation.fixture.json`
Changelog: v1 initial Sprint 2 prompt contract.
