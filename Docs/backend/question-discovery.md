# Question Discovery

Prompt 5 adds a logical read side to the authoritative Question Runtime. Commands still use the aggregate/unit-of-work path. Queries use `QuestionReadRepository`, backed by the same PostgreSQL database, and return transport-neutral read models.

Implemented layers:

1. exact summary/detail retrieval
2. deterministic active-by-default listing
3. controlled AND-composed filters
4. normalized database substring search
5. one-hop relation-aware discovery
6. semantic-structure (Frame-compatible) discovery

There is no separate projection, cache, message consumer, search cluster, graph database, vector store, AI search, recommendation, or personalization. Current Question state is authoritative; revisions are intentionally absent from search.

The runtime owns `QuestionSummaryView`, `QuestionDetailView`, `ListQuestionsQuery`, `SearchQuestionsQuery`, cursor validation, and query normalization. PostgreSQL owns predicate evaluation. Each list/search operation uses one bounded statement and does not calculate a total count.

Prompt 4 implemented `QuestionSemanticStructure`, not a separately named `QuestionFrame`. Prompt 5 projects that authoritative structure as the Frame summary and records the Question version at each semantic update for deterministic freshness.

Known boundary: Prompt 4 constraints are untyped strings. `constraint_type` is reserved but rejected with `question_constraint_filter_invalid`; adding a controlled taxonomy is an upstream domain decision, not a search-layer inference.
