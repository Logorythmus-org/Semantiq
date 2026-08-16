# Question Text Search

Prompt 5 search is PostgreSQL-backed case-normalized substring matching over current Question text.

Migration 6 adds:

- locally installed `pg_trgm`
- immutable `normalize_question_search_text(text)`
- stored generated `questions.search_text`
- GIN trigram index `questions_search_trigram_idx`

The repository executes parameterized `LIKE` against the normalized column. `%`, `_`, and backslash in user input are escaped and treated literally. Results use controlled chronological ordering rather than textual relevance.

Because `search_text` is generated from `questions.text`, create and update synchronization is transactional and requires no worker. Archived rows remain indexed but the default lifecycle predicate excludes them. Restore makes the current row discoverable immediately. Revision text is never searched.

Implemented behavior is substring search, not full linguistic search. There is no stemming, typo tolerance, synonym expansion, translation, query rewriting, relevance score, semantic similarity, vector retrieval, or recommendation.
