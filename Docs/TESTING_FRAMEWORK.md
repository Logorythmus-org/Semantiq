# Testing Framework

Tech Club targets more than 90% meaningful coverage across production modules. Coverage is necessary but not sufficient; tests must prove behavior, contracts, resilience, and safety.

## Test Types

- Unit tests.
- Integration tests.
- Contract tests.
- Snapshot tests.
- UI tests.
- API tests.
- Workflow tests.
- Agent tests.
- Benchmark tests.
- Performance tests.
- Stress tests.
- Security tests.
- Accessibility tests.
- End-to-end tests.

## Test Ownership

Packages own unit and contract tests. Services own API, integration, security, and health tests. Apps own UI, accessibility, and e2e tests. Cross-system tests live under `tests/`.

## Acceptance Test Format

```md
## Acceptance Test <ID>

Given <state>
When <action>
Then <observable result>
And <audit, event, graph, or documentation outcome>
```

## Coverage Targets

- Core, security, identity, data, graph, and kernel: 95% target.
- Domain packages: 90% target.
- Apps and UI flows: route and workflow coverage plus accessibility checks.
- Agents and workflows: approval, failure, retry, memory, and provider fallback coverage.

## Non-Negotiable Tests

- Authorization decisions.
- Audit immutability.
- Migration rollback.
- Offline behavior.
- Human approval gates.
- Semantiq explainability.
- Event replay.
- Federation optionality.
- Marketplace approval and wallet-sensitive operations.
- Protocol compatibility.
