# Question Audit Growth Policy

Records are retained during Phase B and cannot be updated or deleted. Reads are ordered and capped at 100 rows per request. The `(question_id, occurred_at DESC, id DESC)` index supports bounded review.

Partitioning, archival storage, legal holds, and retention durations require later governance and measured volume; Prompt 6 does not invent them.
