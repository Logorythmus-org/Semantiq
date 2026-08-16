# Backend Dependency Rules

`packages/core` and `packages/shared` must not import PostgreSQL, ORM, migration, Docker, or API framework code. `packages/persistence` may depend on shared contracts and the `pg` driver. API services may depend on persistence adapters, never the reverse.
