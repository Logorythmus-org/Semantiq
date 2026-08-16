# Prompt 7 Transaction Matrix

| Operation              | State + revision/event/idempotency boundary                          | Result |
| ---------------------- | -------------------------------------------------------------------- | ------ |
| Create Question        | Question + outbox + optional key                                     | Passed |
| Update/archive/restore | CAS Question + immutable revision + outbox + optional key            | Passed |
| Create relation        | edge + outbox + optional key                                         | Passed |
| Remove relation        | CAS lifecycle update + outbox + optional key                         | Passed |
| Create/update Frame    | current JSONB + immutable revision on update + outbox + optional key | Passed |
| Add/remove source      | source + audit + outbox + optional key                               | Passed |
| Submit/withdraw report | report + audit + outbox + optional key                               | Passed |
| Open case/apply action | case/state/action + audit + outbox + optional key                    | Passed |

Injected outbox failures and stale versions roll back partial state. PostgreSQL tests and the full journey provide the authoritative evidence.
