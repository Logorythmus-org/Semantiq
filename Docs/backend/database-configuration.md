# Database Configuration

`loadSemantiqSettings()` is the preferred public entry point; `loadTechClubSettings()` remains a backward-compatible alias for integrations using the historical API. Its `database` section delegates to `loadPersistenceConfig()` and supports `DATABASE_URL`, pool size, connect timeout, statement timeout, and echo mode. Migrations, runtime, tests, and health checks must receive this section or an explicitly derived `PersistenceConfig`; they must not parse `DATABASE_URL` independently.
