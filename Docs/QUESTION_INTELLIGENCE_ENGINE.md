# Question Intelligence Engine

The Question Intelligence Engine is Tech Club's thinking assistant for questions. It helps users ask better questions; it does not answer quickly for them or replace their judgment.

## Purpose

Move users from vague curiosity to clear question, contextualized inquiry, evidence-aware exploration, research-ready question, and project-ready knowledge.

## Responsibilities

Question refinement, expansion, compression, intent extraction, context mapping, ambiguity detection, assumption detection, contradiction detection, duplicate detection, semantic tagging, relation suggestion, evidence recommendation, hypothesis generation, experiment suggestion, project suggestion, learning path suggestion, game suggestion, and benchmark preparation.

## Interaction Model

The assistant shows original question, detected intent, improved version, alternative versions, assumptions, unknowns, suggested tags, related questions, possible evidence, research directions, risk notes, and Semantiq preview.

## Human Control

The user approves or rejects suggestions. No automatic overwriting is allowed.

## Package Layout

- `packages/question-intelligence/src/contracts.ts`: engine, pipeline, agents, prompts, suggestions, reports, plans, events, and API contracts.
- `packages/question-intelligence/src/index.ts`: local deterministic scaffold for validation.
- `packages/question-intelligence/prompts/`: versioned prompt templates.
- Future directories: `agents/`, `pipeline/`, `intent/`, `ambiguity/`, `assumptions/`, `tagging/`, `duplicates/`, `relations/`, `evidence/`, `hypotheses/`, `experiments/`, `projects/`, `games/`, `preview/`, `schemas/`, `api/`, `events/`, `ui/`, `tests/`, and `docs/`.
