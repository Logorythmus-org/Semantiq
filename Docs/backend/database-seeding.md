# Database Seeding

Prompt 4 does not add automatic seeds. Application startup must never silently mutate the database.

When seed data is introduced, keep development, test, and benchmark fixtures separate, make each seed idempotent, use local synthetic data only, and require an explicit command with a dry-run mode where practical. Test cleanup must refuse any database whose name or environment does not clearly identify it as a test database.
