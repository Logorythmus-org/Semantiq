# Prompt 7 Trust Signal Validation

Trust signals were validated after source, report, moderation, revision, Frame, and relation activity. Public output contains observable counts/state only; internal `openReportCount` requires moderator capability. No truth score, opaque confidence, recommendation, or automated verdict exists.

The complete PostgreSQL journey returned `sourceCount=1`, `framePresent=true`, and `moderationState=discovery_restricted`. Public restricted reads were hidden while moderator reads remained available.
