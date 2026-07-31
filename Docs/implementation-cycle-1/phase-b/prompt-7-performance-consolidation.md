# Prompt 7 Performance Consolidation

Final deterministic dataset: 10,000 Questions, 7,500 revisions (three per edited Question), 29,991 relations, 5,000 Frames, 500 sources, 100 reports, 10 cases, and 400 audit rows. PostgreSQL 16.14, local Docker, 20 iterations at the largest tier, zero errors.

At 10k, exact ID was 1.189 ms median/1.502 ms p95. Listing/filter/search medians were 1.877-2.729 ms and p95 values 2.186-4.097 ms. Relation filter p95 was 3.267 ms; Persian 2.977 ms; German 2.705 ms. Actual rare-text SQL used the trigram index and completed in 1.044 ms. These are regression baselines, not production SLOs.
