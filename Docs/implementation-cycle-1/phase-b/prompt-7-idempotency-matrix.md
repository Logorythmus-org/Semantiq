# Prompt 7 Idempotency Matrix

| Scope                     | Key behavior                                         | Result |
| ------------------------- | ---------------------------------------------------- | ------ |
| Question create/mutations | exact replay; changed fingerprint conflicts          | Passed |
| Relation create/remove    | exact replay; changed target/version/actor conflicts | Passed |
| Frame put                 | exact replay; changed version/content conflicts      | Passed |
| Source add/remove         | exact replay; changed command conflicts              | Passed |
| Report submit/withdraw    | exact replay; changed command conflicts              | Passed |
| Case open/action apply    | exact replay; changed command conflicts              | Passed |

Keys are hashed at rest. Outbox and business state are not duplicated on replay.
