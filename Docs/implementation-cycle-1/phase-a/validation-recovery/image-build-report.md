# Image Build Report

Passed: `docker compose build --pull=false api`. Image: `tech-club-api:latest`. First uncached build completed in approximately 266.3 seconds, dominated by pulling `node:22-bookworm-slim`; subsequent cached build completed in 6.6 seconds. No `.env` or build secret was copied. Image history showed source copies and the Node base only.
