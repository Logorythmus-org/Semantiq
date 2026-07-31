# Performance Report

Actual measurements: first API image build approximately 266.3 seconds; cached rebuild 6.6 seconds; isolated PostgreSQL readiness about 5 seconds; Compose API readiness about 9 seconds on first start; API recovery after PostgreSQL restart about 4 seconds; API restart recovery about 4.6 seconds; host `pnpm verify` final run 23.5 seconds. No idle memory measurement was collected.
