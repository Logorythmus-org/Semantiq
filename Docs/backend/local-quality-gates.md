# Local Quality Gates

`pnpm verify` is authoritative for local validation. It records stage status in `artifacts/verification/summary.json` and fails on blocking command failures. Docker runtime is deliberately explicit and not hidden.
