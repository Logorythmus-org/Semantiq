# Search Architecture

Search is a supporting bounded context. It indexes published models from other contexts and does not own source domain state.

## Search Layers
- Keyword Search: exact and fuzzy text matching.
- Semantic Search: meaning-based retrieval over approved embeddings or semantic indexes.
- Graph Search: relationship traversal and neighborhood exploration.
- Question Search: question text, metadata, status, tags, and quality signals.
- Project Search: goals, tasks, linked questions, members, and outcomes.
- Repository Search: source metadata, files, snapshots, and adapter-provided indexes.
- Knowledge Search: knowledge objects, evidence, hypotheses, papers, and relationships.
- Future Vector Search: pluggable vector indexes without changing domain objects.

## Indexing Rules
- Indexes are projections.
- Source contexts publish events and read models.
- Search stores denormalized search documents only.
- Rebuilds must be possible from source events and read models.

## Query Flow
Clients submit a search query to Search. Search resolves permissions, chooses indexes, returns ranked result references, and lets source contexts hydrate details.

## Privacy
Search must not reveal hidden objects through result counts, snippets, embeddings, or graph neighborhoods.

## Data Platform Search Engines
The Data Platform supports multiple search engines behind one query contract:
- Keyword Search for exact, fuzzy, and ranked text matching.
- Semantic Search for meaning-based retrieval over provider-neutral embeddings.
- Knowledge Graph Search for node and relationship traversal.
- Repository Search for source snapshots, files, metadata, and adapter indexes.
- Question Search for question text, state, tags, quality signals, relationships, and benchmark history.
- Project Search for goals, linked questions, tasks, members, and deliverables.
- Workspace Search for local files, mounts, panels, notes, and project state.
- Agent Search for workflows, tool sessions, memory references, and agent notes.
- Benchmark Search for cases, runs, dimensions, scores, and explanations.
- Hybrid Search for combined keyword, graph, semantic, and permission-filtered results.
- Future AI Search for multimodal and agent-assisted exploration.

Search indexes are projections. Source objects, relationships, versions, and permissions remain authoritative in their owning contexts.
