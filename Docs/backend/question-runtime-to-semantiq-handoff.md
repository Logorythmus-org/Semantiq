# Question Runtime to Semantiq Handoff

Semantiq may consume `GET /questions/{id}/semantic-snapshot`. Schema 1.0 contains Question id/text/status/version and Frame id/version/freshness plus content-addressed Context, Assumption, Constraint, Unknown, Uncertainty, Scope, and Perspective components. It excludes actors, reports, moderation rationale, audit, source locators, trust scores, internal metadata, and open possibilities.

Semantiq must treat the snapshot as human-authored input, preserve IDs/schema version, honor discovery access, and remain read-only. It must not write scores or inferred truth into the Question Runtime.
