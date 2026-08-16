# Question Moderation

Cases aggregate one or more open reports. Case states are `open`, `under_review`, `action_required`, `resolved`, and `dismissed`. Actions are immutable and require optimistic concurrency.

Supported actions are `no_action`, `mark_under_review`, `restrict_discovery`, `archive_question`, `restore_question`, `request_revision`, and `dismiss_reports`.
