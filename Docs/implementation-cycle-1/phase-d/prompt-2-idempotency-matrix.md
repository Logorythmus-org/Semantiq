# Phase D Prompt 2 Idempotency Matrix

| Operation           | Classification                        | Runtime result  |
| ------------------- | ------------------------------------- | --------------- |
| Tool registration   | Undefined                             | Not Executed    |
| Echo                | Naturally idempotent candidate        | Not Implemented |
| Hash                | Naturally idempotent candidate        | Not Implemented |
| Metadata inspection | Naturally idempotent candidate        | Not Implemented |
| Local write         | Requires future operation declaration | Not Implemented |
| State transition    | Requires key and persisted state      | Not Implemented |

No retry decision is safe until operation identity, side effects, authorization, request fingerprint, and durable completion state exist.
