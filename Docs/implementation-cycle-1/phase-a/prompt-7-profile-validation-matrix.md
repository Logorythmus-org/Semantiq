# Prompt 7 Profile Validation Matrix

| Profile     | Status                        | Evidence / blocker                                        |
| ----------- | ----------------------------- | --------------------------------------------------------- |
| development | Passed                        | settings and API startup tests                            |
| test        | Passed                        | isolated test URL/path validation and test suite          |
| docker      | Partially passed              | config validates; runtime not executed                    |
| benchmark   | Passed at settings level      | deterministic seed/output settings; benchmark not run     |
| migration   | Passed at settings/unit level | migration config and runner; real DB not executed         |
| offline     | Passed at configuration level | AI disabled by default; no OS-level network sandbox claim |
