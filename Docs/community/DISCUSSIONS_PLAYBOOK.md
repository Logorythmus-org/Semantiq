# GitHub Discussions Playbook

This playbook defines how SemantIQ should use GitHub Discussions as a conversational layer around the repository.

Discussions are non-normative. Repository code, schemas, specifications, governance files, reviewed documentation, issues, and pull requests remain the durable sources for implemented state and approved work.

## Recommended categories

### Announcements

Maintainer-authored release, repository, governance, or community notices.

Use this category for factual changes that have already happened. Do not use announcements to imply roadmap commitments or external validation.

### Q&A

Installation, setup, CLI/API usage, SDK questions, documentation interpretation, and contributor-process questions.

When an answer exposes a reproducible defect or documentation mismatch, convert the outcome into an issue.

### Ideas

Early feature, architecture, workflow, benchmark, or community ideas that need discussion before a formal proposal.

When the idea becomes actionable, promote it to the appropriate issue form or RFC process.

### Show and Tell

Community-built examples, integrations, benchmark packs, tooling, visualizations, and reproducible demonstrations.

A community demonstration is not automatically an official SemantIQ capability, supported integration, or external validation.

### Replication & Benchmark Results

Independent reproduction attempts, divergent results, blocked runs, benchmark observations, and methodology questions.

Material reproduction claims should ultimately use the Independent Replication Report so provenance and independence can be reviewed.

### Integrations & Compatibility

Experience reports for operating systems, model providers, runtimes, adapters, storage systems, and external tooling.

Compatibility observations should record exact versions and should not be generalized beyond the evidence supplied.

## Suggested pinned posts

1. **Welcome to SemantIQ Discussions**
   - what SemantIQ is;
   - Public Alpha status;
   - where to ask questions;
   - where issues and RFCs belong;
   - security and privacy warning.

2. **How to contribute without writing core code**
   - clean-environment reproduction;
   - compatibility reports;
   - docs validation;
   - examples;
   - benchmark-pack proposals.

3. **Share a reproduction or benchmark result**
   - exact revision;
   - environment;
   - commands;
   - observed outcome;
   - divergences;
   - link to formal Independent Replication Report.

## Promotion rules

Use this flow:

```text
Discussion
   |
   +-- remains exploratory / support conversation
   |
   +-- actionable defect ----------------> Issue
   |
   +-- bounded feature ------------------> Feature Request
   |
   +-- architecture / semantics ---------> RFC / Core issue
   |
   +-- independent reproduction ---------> Replication Report
   |
   +-- implementation -------------------> Pull Request
```

Promotion does not require deleting the original discussion. Link both directions so the reasoning trail remains visible.

## Moderation and truth boundaries

- Keep technical disagreement evidence-focused.
- Do not post secrets, private data, proprietary prompts, or confidential datasets.
- Do not disclose vulnerabilities publicly; follow `SECURITY.md`.
- Do not convert community interest into claims of adoption.
- Do not convert successful owner-controlled runs into claims of independent replication.
- Do not describe proposed work as implemented.
- If a statement becomes normative or release-relevant, move it into a reviewed repository artifact.
