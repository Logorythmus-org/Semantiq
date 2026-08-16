# Question Search Privacy

Search text may reveal sensitive intent. Ordinary discovery logs therefore exclude raw and normalized query text, cursor contents, returned Question text, semantic statements, and database errors.

The structured `question.discovery` event records only:

- operation (`list` or `search`)
- `queryPresent`
- normalized query length
- active filter names
- result count and page limit
- stable result/error code
- correlation ID
- duration

Docker validation searched for a unique private marker and confirmed zero marker occurrences in API logs while discovery telemetry remained present. Repository exceptions are mapped to `question_search_unavailable` and do not expose SQL or driver details.

Correlation IDs and identifiers still have privacy/retention implications. Prompt 6 must define authenticated actor context, log access, retention, deletion response, rate limits, and monitoring. Future personalization, semantic search, and query analytics require explicit consent and a separate privacy review.
