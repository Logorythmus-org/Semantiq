# Product Decision Record PDR-001: Public Alpha Feedback Triage Policy

## Status
ACCEPTED

## Context
During Public Alpha testing, public feedback must be sanitized locally and triaged without requiring central tracking telemetry or cloud databases.

## Decision
All feedback collection, triage, and synthesis in SemantIQ Benchmarks will run through `@tech-club/semantiq` local utilities (`submitPublicFeedback()`, `synthesizeFeedback()`) ensuring 100% data residency and privacy compliance.
