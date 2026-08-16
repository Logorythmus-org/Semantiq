# Testing Architecture

Vitest is the authoritative TypeScript test runner. Tests are grouped by unit, integration, contracts, security, smoke, and package regression concerns. Production code never imports test support. Real PostgreSQL/Docker tests are opt-in and deferred while the local daemon is unavailable.
