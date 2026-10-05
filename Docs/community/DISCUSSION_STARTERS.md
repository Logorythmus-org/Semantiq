# Discussion Starter Posts

These posts are ready to publish in GitHub Discussions after the recommended categories are configured.

## Post 1 — Welcome to SemantIQ Discussions

**Suggested category:** Announcements  
**Suggested action:** Pin

### Title

Welcome to SemantIQ Discussions — start here

### Body

Welcome to the SemantIQ community.

SemantIQ is **Behavioral Evidence Infrastructure for AI Systems**, currently at **Public Alpha (Experimental)** maturity.

Use Discussions for:

- setup and usage questions;
- early ideas;
- experience reports;
- integration and compatibility observations;
- benchmark and reproduction conversations;
- examples and community-built work.

Use Issues when a conversation becomes a bounded defect, feature request, RFC, benchmark proposal, methodology proposal, or formal reproduction report.

Useful entrypoints:

- `COMMUNITY.md` — choose a participation path;
- `CONTRIBUTING.md` — Fast and Core contribution paths;
- `SUPPORT.md` — routing for questions and reports;
- `SECURITY.md` — vulnerability reporting.

Please do not post credentials, private data, proprietary prompts, confidential datasets, or vulnerability details.

One important project rule: discussion, interest, or proposal acceptance does **not** by itself establish implementation, adoption, external validation, production readiness, or scientific authority.

If you are new, tell us what you are trying to run or understand. A small reproducible question is a good place to start.

---

## Post 2 — Ways to contribute without changing core architecture

**Suggested category:** Q&A or Announcements  
**Suggested action:** Pin

### Title

New contributor? Here are useful ways to help without changing core architecture

### Body

You do not need to redesign a benchmark or change the evidence engine to make a useful contribution.

High-value Public Alpha contributions include:

1. Run the documented quickstart on a clean environment and report friction.
2. Submit an OS/runtime/integration compatibility observation.
3. Correct a stale command, broken link, or unclear documentation path.
4. Add a bounded example using public or synthetic inputs.
5. Add a focused regression test for a documented edge case.
6. Attempt an independent reproduction and report successful, partial, divergent, or blocked results.

Look for issues labeled **good first issue** and **help wanted**.

Fast-path contributions should stay focused and record how they were validated. Core architecture, benchmark semantics, evidence logic, security-sensitive behavior, governance, or breaking interfaces require the Core contribution path.

Divergent or failed reproduction attempts are welcome when documented precisely; they are evidence too.

---

## Post 3 — Share a reproduction or benchmark result

**Suggested category:** Replication & Benchmark Results

### Title

Share a SemantIQ reproduction or benchmark result

### Body

If you ran a SemantIQ workflow outside owner-controlled infrastructure, we would like to hear what happened.

Please include:

- exact SemantIQ commit SHA;
- software/schema versions where relevant;
- operating system and architecture;
- Node/pnpm/Python versions where applicable;
- runtime/provider/model configuration where applicable;
- exact sanitized commands;
- expected outcome;
- observed outcome;
- first material divergence, if any;
- whether the result was successful, partial, divergent, or blocked.

Do not include credentials, private data, proprietary prompts, or confidential datasets.

For a result that should be reviewed as an independent reproduction attempt, use the repository **Independent Replication Report** issue form so provenance and independence can be evaluated.

A successful community run is not automatically classified as verified external replication until the repository's review criteria are satisfied.
