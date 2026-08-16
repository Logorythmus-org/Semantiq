# Prompt 7 Database Constraint Report

PostgreSQL reported 92 constraints on Question-owned tables. Primary/foreign keys, controlled vocabularies, text bounds, lifecycle metadata, versions, semantic JSON shape, distinct relation endpoints, canonical relation identity, active source/report uniqueness, and append-only audit/action triggers were reviewed.

Migration 8 permits only the active-to-removed relation transition with version increment; physical delete and all other relation mutation remain blocked. Direct database constraint and immutability tests pass.
