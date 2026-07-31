# Testing Commands

- `pnpm test`: full fast regression suite.
- `pnpm test:unit`: unit, contract, and package tests.
- `pnpm test:integration`: local integration tests.
- `pnpm test:contracts`: shared contract suite.
- `pnpm test:security`: security regressions.
- `pnpm test:coverage`: V8 coverage report.
- `pnpm verify`: local quality gate and JSON summary.
- `VERIFY_DOCKER=1 pnpm verify`: explicit Docker verification when Docker Desktop is available.
