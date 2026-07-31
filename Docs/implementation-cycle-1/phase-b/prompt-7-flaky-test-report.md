# Prompt 7 Flaky Test Report

Five consecutive full runs with `REAL_POSTGRES_TEST` passed 52 files and 192 tests each. Durations were 30.04, 32.91, 32.28, 31.62, and 33.43 seconds. No retry, quarantine, skip, ordering failure, or intermittent conflict occurred.

The default suite still intentionally skips 34 tests when PostgreSQL opt-in is absent; the final evidence does not count those skipped runs as full validation.
