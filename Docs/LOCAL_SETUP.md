# Local Setup

## Prerequisites

- Node.js 22.
- pnpm 11.7.0.
- Docker, when using the local service stack.

## Validate Locally

```bash
pnpm install
pnpm typecheck
pnpm test
docker compose config --quiet
```

## Run MVP Journey Test

```bash
pnpm vitest run packages/mvp-runtime/tests/mvp-journey.test.ts
```

The MVP runtime does not require cloud services.
