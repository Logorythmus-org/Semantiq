# Question Search Ranking Boundary

Prompt 5 does not rank by quality, popularity, engagement, certainty, relevance, recommendation, or personalization.

Substring search uses the same controlled chronological sort modes as listing:

- `newest`: creation time descending, ID descending
- `oldest`: creation time ascending, ID ascending
- `recently_updated`: update time descending, ID descending

These orders are navigation choices, not quality signals. The database may choose a trigram index internally, but no trigram similarity score is exposed.

Future textual relevance, Semantiq quality, recommendation, personalized feed, and vector similarity are separate contracts. They must use transparent names, authorization/lifecycle reconciliation, deterministic tie-breakers, and provenance. None may be presented as truth or replace the Question Runtime.
