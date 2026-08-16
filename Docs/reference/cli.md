# CLI Command Reference

The primary automation runner is `tools/automation/cli.mjs` (accessible via `pnpm` scripts or `scripts/semantiq.mjs`).

## Commands

- `pnpm doctor`: Runs first-time environment diagnostics.
- `pnpm smoke`: Executes the local offline deterministic smoke test.
- `npx tsx tools/automation/cli.mjs connector`: Inspects registered model connectors.
- `npx tsx tools/automation/cli.mjs preflight`: Validates system readiness and dependencies.
- `npx tsx tools/automation/cli.mjs semantiq`: Queues deterministic evaluation engine.
- `npx tsx tools/automation/cli.mjs reproduce`: Runs deterministic reproduction verification.
- `npx tsx tools/automation/cli.mjs export`: Exports workspace reports to JSON and Markdown.
