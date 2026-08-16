# question-research-plan.v1

Stable ID: `question-research-plan.v1`
Version: `1.0.0`
Purpose: Draft a research project from an approved question.
Input schema: `{ "question": "string", "analysis": "object", "semantiqReport": "object" }`
Output schema: `{ "title": "string", "problemStatement": "string", "scope": "string", "methodology": "string", "evidence": ["string"], "tasks": ["string"], "milestones": ["string"], "risks": ["string"], "successCriteria": ["string"] }`
Safety notes: Drafts require user approval before project creation.
Evaluation fixtures: `question-research-plan.fixture.json`
Changelog: v1 initial Sprint 2 prompt contract.
