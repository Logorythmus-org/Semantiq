# Question Runtime Troubleshooting

If PostgreSQL tests skip, set `REAL_POSTGRES_TEST`. If readiness is degraded, inspect `docker compose logs api postgres` and verify migration head 8. A 409 normally indicates stale expected version, duplicate semantic identity, or idempotency-key mismatch. A public 404 may intentionally hide a restricted Question. Benchmarks refuse destructive reseeding unless their reset guard is set.
