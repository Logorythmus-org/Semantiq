# Question Query Complexity Policy

Prompt 5 bounds discovery at every public input boundary:

- allowlisted, non-repeated query parameters only
- maximum text query length 200 Unicode code points
- maximum cursor length 512 characters
- page size 1 through 100; default 20
- controlled enums for lifecycle, sort, uncertainty, relation type, and direction
- identifiers limited to 128 safe characters
- timestamps require explicit timezone and valid ranges
- AND-only filter composition
- one-hop relation filters only
- no total count and no arbitrary field/sort/expression input

The PostgreSQL repository parameterizes every value. One list/search request executes one statement. Candidate rows are ordered and limited before page-local relation counts are calculated, avoiding an N+1 query loop and bounding lateral work.

The database profile applies a 10-second statement timeout and bounded pool size. Prompt 6 must add an authenticated actor boundary and consider per-actor/IP rate limiting. Query plans should be re-measured at materially larger data volumes or after adding authorization predicates. New indexes require measured evidence because write amplification and storage cost are part of the decision.
