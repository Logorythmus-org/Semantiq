# Prompt 6 Query Plan Report

PostgreSQL 16 plans were collected with `enable_seqscan=off` to confirm index eligibility on the small validation dataset.

- Discovery: index-only scan on `questions_discovery_newest_idx` plus anti-join using `question_moderation_discovery_idx`.
- Active source list: index-only scan on `question_source_list_idx`.
- Active report review: index scan on `question_report_active_unique` plus bounded sort.
- Audit history: index-only scan on `question_audit_query_idx`.

No unbounded recursive graph or semantic JSON scan was introduced by Prompt 6.
