# Question Semantic API

Base path: `/api/v1/questions/{questionId}`.

## Routes

| Method | Route                           | Access                     |
| ------ | ------------------------------- | -------------------------- |
| `PUT`  | `/semantic-structure`           | Question creator           |
| `GET`  | `/semantic-structure`           | Current public-read policy |
| `GET`  | `/semantic-structure/revisions` | Question creator           |

## Put

`PUT` is a complete replacement. The body contains `expectedVersion`, all eight semantic sections, and optional `reason`. `expected_version` and `open_possibilities` are accepted input aliases. Actor identity comes only from `x-actor-id`; `idempotency-key`, `x-correlation-id`, and `x-causation-id` follow existing Question API behavior.

Creation requires `expectedVersion: 0` and returns `201`. Replacement requires the current positive semantic version and returns `200`. An identical idempotent replay returns the original response and status.

## Read

Current reads return the structure, creator/update attribution, ISO timestamps, and independent semantic version. Revision history returns ordered full before/after snapshots and the current semantic version.

## Errors

- `422`: invalid ID, version, shape, list bound, uncertainty, scope, statement, or idempotency key.
- `403`: caller is not the Question creator for writes or history.
- `404`: Question or semantic structure does not exist.
- `409`: stale version, existing version-0 create, no-op replacement, archived write, or idempotency conflict.
- `503`: persistence failure or semantic runtime not wired.

Errors and logs never echo supplied semantic statements.
