# Misuse & Failure Scenario Report

This document records testing of misuse, edge case, and failure recovery experiences for **SemantIQ Benchmarks**.

---

## Failure & Misuse Test Matrix

| Scenario | Tested Input / Condition | Observed System Response | Recovery Behavior | Status |
|---|---|---|---|---|
| **Missing API Key** | Remote call without `.env` key | Displays `ERR_MISSING_CREDENTIAL` with setup advice | Recommends local mock evaluation | Pass |
| **Quota Exhaustion** | HTTP 429 response from remote provider | Logs `ERR_QUOTA_EXHAUSTED` | Suggests retry backoff or offline mode | Pass |
| **Corrupt Benchmark Pack** | Invalid JSON/YAML structure | Throws schema validation error with line reference | Prevents execution of malformed pack | Pass |
| **Network Loss** | Disconnected internet during remote call | Catches connection error `ERR_NETWORK_DISCONNECTED` | Graceful retry attempt before exit | Pass |
| **Prompt Injection** | Subject content containing malicious instructions | Evaluator treats prompt input strictly as data | Prevents prompt hijacking | Pass |
| **Node Version Mismatch** | Execution under unsupported Node major version | Doctor flags `[FAIL] Node.js Version` | Directs user to upgrade Node.js | Pass |

---

## Verdict

**PASSED** — All failure scenarios yield clear diagnostic error codes, root-cause explanations, and actionable next steps.
