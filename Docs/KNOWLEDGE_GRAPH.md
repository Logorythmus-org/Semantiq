# Knowledge Graph

The Knowledge Graph is the heart of Tech Club. Every important object can become a semantic node.

## Semantic Node Examples
Question, Answer, Project, Repository, Paper, Evidence, Experiment, Game, Narrative, Workflow, Agent, User, Community, Book, Video, Dataset, and Conversation.

## Node Shape
Each node contains:
- stable id
- human-readable id
- semantic URI
- namespace
- version
- hash
- metadata
- semantic tags
- relations
- history
- permissions
- benchmark results
- agent notes
- references

## Relationship Shape
Each relationship contains source, target, type, confidence, weight, evidence, creator, timestamp, version, permissions, and provenance.

## Relationship Types
`supports`, `contradicts`, `extends`, `explains`, `depends_on`, `created_from`, `question_of`, `evidence_for`, `part_of`, `member_of`, `inspired_by`, `similar_to`, `duplicate_of`, `alternative_to`, `references`, and `validated_by`.

## Integrity Rules
- Node ids are globally stable.
- Relationship endpoints must reference existing or externally resolvable nodes.
- Relationship mutations create history.
- Permission checks apply to graph reads as well as writes.
- Graph indexes are projections and can be rebuilt.

## Workspace Graph
Every workspace automatically generates a knowledge graph from questions, projects, dependencies, repositories, research, conversations, agents, benchmarks, workflows, games, and communities.

Manual graph building is not required. Object creation, linking, comments, task dependencies, agent actions, benchmark results, document references, and project lifecycle events project relationships into the graph.
