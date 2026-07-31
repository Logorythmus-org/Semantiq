# Question Runtime Performance Policy

Use deterministic local datasets at 100, 1,000, and 10,000 Questions, representative revisions/relations/Frames/safety records, warm-up calls, p50/p95, error counts, and `EXPLAIN ANALYZE`. Treat results as regression baselines, not SLOs. Add an index only for measured pathological plans; retain bounded pages, graph limits, and statement timeouts.
