# Database Configuration

`loadTechClubSettings()` is the authoritative application entry point. Its `database` section delegates to `loadPersistenceConfig()` and supports `DATABASE_URL`, pool size, connect timeout, statement timeout, and echo mode. Migrations, runtime, tests, and health checks must receive this section or an explicitly derived `PersistenceConfig`; they must not parse `DATABASE_URL` independently.
