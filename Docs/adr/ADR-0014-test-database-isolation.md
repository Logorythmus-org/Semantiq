# ADR-0014: Test Database Isolation

Real PostgreSQL is authoritative for database integration. Tests must use an explicitly named test database and never development data. Until Docker is available, adapter unit tests use a fake SQL client; no SQLite substitute is introduced.
