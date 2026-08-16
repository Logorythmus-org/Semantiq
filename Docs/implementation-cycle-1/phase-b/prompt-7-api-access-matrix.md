# Prompt 7 API Access Matrix

| Resource                              | Public                | Creator                            | Moderator           |
| ------------------------------------- | --------------------- | ---------------------------------- | ------------------- |
| Published Question/list/search/detail | Read                  | Read/mutate own                    | Read                |
| Archived exact/Frame                  | Current read          | History/read/restore own           | Read                |
| Restricted Question/graph/snapshot    | Hidden                | Hidden unless moderator            | Read                |
| Relations                             | List/graph active     | Create/remove own source assertion | Read                |
| Frame                                 | Current/snapshot read | Put/history own                    | Restricted read     |
| Sources                               | Active list/get       | Add/remove own Question            | Internal read       |
| Reports                               | No list               | Submit/withdraw own report         | List/review         |
| Cases/actions/audit/internal trust    | No                    | No                                 | Capability required |

`x-actor-id` is trusted upstream context for local execution and is not an authentication mechanism.
