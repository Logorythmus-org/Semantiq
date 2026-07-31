# Persistence Across Restart Report

Passed. A `system_metadata` row and outbox row written to the Compose validation database survived `docker compose down` followed by `docker compose up -d postgres api` without `-v`. Counts after restart were 1 and 1. The first attempted insert had a PowerShell quoting failure and inserted 0/0; it was corrected and rerun successfully.
