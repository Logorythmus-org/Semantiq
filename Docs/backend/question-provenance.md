# Question Provenance

`QuestionSourceReference` records optional, creator-declared origins without judging credibility. References are identified independently from Questions, retain attribution and timestamps, and are logically removed.

Active duplicate identity is `(question_id, source_type, normalized_locator)`. Add/remove writes commit with compact outbox events and authoritative audit records.
