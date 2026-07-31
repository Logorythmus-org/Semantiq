# Prompt 7 Security Register

| Finding                                        | Severity                            | Status                                    |
| ---------------------------------------------- | ----------------------------------- | ----------------------------------------- |
| Header actor context is not authentication     | High outside trusted local boundary | Open, deployment blocker                  |
| Moderator list is static process configuration | Medium                              | Open, Phase C/auth input                  |
| Fixed-window limiter is process-local          | Medium for multi-instance use       | Open, local phase accepted                |
| SQL injection/error leakage                    | High                                | Closed by parameters and sanitized errors |
| Identity spoofing in bodies                    | High                                | Closed; header context only               |
| Graph/snapshot discovery leakage               | High                                | Closed by safety filtering/hiding         |
| Unbounded input/graph/page/audit reads         | High                                | Closed by runtime bounds                  |

No critical local-runtime finding remains. Security tests passed on host and in Docker.
