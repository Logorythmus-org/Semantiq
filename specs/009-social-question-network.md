# Social Question Network Specification

## Purpose
Define the Social Question Network: Tech Club's question-centered social product system where curiosity, evidence, discussion, knowledge, projects, and innovation replace post, like, follower, and advertising mechanics.

## Goals
- Make Question the fundamental social object.
- Provide question creation, feed, profiles, graph, discovery, relations, lifecycle, collaboration, moderation, reputation, analytics, and benchmarking architecture.
- Ensure every question participates in the Knowledge Graph and Semantiq Benchmark.
- Make discussions structured knowledge instead of linear comment threads.
- Prioritize question quality, scientific potential, learning value, collaboration need, evidence quality, semantic novelty, diversity, and curiosity over popularity.

## Requirements
- Questions support identity, title, summary, description, intent, category, difficulty, research potential, scientific potential, status, language, visibility, creator, contributors, version history, benchmark history, evidence, observations, hypotheses, experiments, linked objects, semantic tags, graph links, agent notes, and AI suggestions.
- Question lifecycle is reversible.
- Discussion contributions become Knowledge Objects.
- Relations are first-class semantic relationships with confidence, evidence, creator, timestamp, version, and explanation.
- Agents assist but never overwrite user content automatically.
- Offline-first editing and background synchronization remain supported.

## Architecture
The Question Network composes Phase 1 platform layers: Question Engine/domain model, Knowledge Graph/Data Platform, Semantiq Benchmark, Identity and reputation, Workspace collaboration, Agent OS, Kernel events, and Search.

## Interfaces
- Question
- QuestionProfile
- QuestionRelation
- QuestionContribution
- QuestionDiscoveryQuery
- QuestionFeedItem
- QuestionModerationCase
- QuestionAnalyticsSnapshot
- QuestionNetworkRepository
- QuestionNetworkService

## Dependencies
- `@tech-club/core`
- `@tech-club/question-engine`
- `@tech-club/data-platform`
- `@tech-club/identity`
- `@tech-club/workspace`
- Future Semantiq adapter

## Risks
- Accidentally recreating social-media popularity ranking.
- Treating discussion as comments instead of structured knowledge.
- Allowing AI to mutate user content without approval.
- Making graph/profile updates manual instead of event-driven.

## Testing
Future tests must cover question creation, editing, versioning, relationships, evidence, graph projection, discussion, benchmark integration, search, moderation, offline mode, performance, accessibility, and stress behavior.

## Future Extension
- UI components for question composer, cards, profile, timeline, graph viewer, evidence panel, discussion graph, benchmark panel, and dashboard.
- Semantiq scoring adapter.
- Recommendation model.
- Moderation workflow.
- Offline sync adapter.

## Acceptance Criteria
- Social Question Network docs exist.
- Question model, profile, graph, lifecycle, discussion, discovery, search, moderation, analytics, events, and API contracts are documented.
- Provider-independent product contracts exist.
- No like-driven ranking or traditional social assumptions are introduced.

## Implementation Notes
This specification authorizes architecture docs and generic contract scaffolding. Production feature implementation requires subsequent approval.
