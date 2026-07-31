# Prompt 6 Performance Baseline

Docker localhost, 100 sequential requests per scenario, one persisted restricted Question:

| Operation         |      p50 |      p95 |       max |
| ----------------- | -------: | -------: | --------: |
| Trust signals     | 3.275 ms | 4.453 ms | 35.866 ms |
| Source list       | 1.290 ms | 3.089 ms |  4.490 ms |
| Hidden exact read | 1.032 ms | 2.582 ms |  3.071 ms |

This is a local regression baseline, not a capacity or production SLO claim.
