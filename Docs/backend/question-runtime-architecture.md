# Question Runtime Architecture

`packages/questions` owns domain/application contracts; `packages/persistence` owns PostgreSQL repositories, transactions, migrations, and outbox persistence; `services/api` owns HTTP envelopes, request context, limits, privacy gates, health, and composition. PostgreSQL is authoritative. Discovery reads committed tables directly. Semantiq is a future consumer and cannot mutate or evaluate Question Runtime state.
