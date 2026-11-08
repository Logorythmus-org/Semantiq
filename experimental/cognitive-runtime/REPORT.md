# SemantIQ Phase 6 — Measured Technical Report

**Date:** 30 October 2026. **Version:** structured IR v0.1, offline prototype. **Execution:** Python local process, Python stdlib only. **Agent LLM calls:** **0**. **GitHub repo edits:** **0**.

## Research question

Can a domain-neutral, typed Multi-Claim IR improve detection of inconsistent or unsupported *structured* assertions and preserve safe nonexecution, compared with a deliberately narrow comparator that checks only the first atomic assertion?

This is not a test of generalized natural-language understanding, LogoNet/LogicNet reasoning, Meta-Coherence as a full framework, Wylo decisions, autonomous agency, or source authenticity.

## Evidence and observed results

| Evaluation | Single-claim baseline | Multi-claim engine | Interpretation |
|---|---:|---:|---|
| 60 developer-authored contract checks (20/domain) | 18/60 (30%) | 60/60 (100%) | Covers explicit conjunction, missing evidence, uncertain text and execution safeguards |
| 30 post-freeze stress checks (10/domain) | 12/30 (40%) | 27/30 (90%) | Three deliberately forged reference-world cases remain failures |
| **All 90** | **30/90 (33.3%)** | **87/90 (96.7%)** | NOT model uplift; test composition favors explicit multi-claim rules |

Per-domain engine outcomes: NBA 29/30, software 29/30 and decision 29/30. The three failures (STRESS-nba-10, STRESS-software-10, STRESS-decision-10) all involve replacing a stored fact and recomputing its *same-bundle* SHA-256. The engine emits `supported_offline` but a higher-level provenance policy would demand `review` because the reference source was never independently authenticated. This test is about the trust boundary: changing and rehashing self-contained data must NOT be reported as an authenticated publisher receipt.

A 13-test Python unittest suite passed. An external-process MCP smoke test sent initialization, tool-discovery and 30 tool calls. It correctly handled 27 ordinary/structured outcomes and 3 intentional JSON-RPC invalid-parameter errors; the 30 tool outputs/errors matched direct-runtime expectations. This is only **transport parity**, not host Codex discovery or full MCP conformance.

## Three executable demonstrations

1. **NBA:** Houston beat Milwaukee in curated data, but the claim "by 40" contradicts the stored margin of 32. Two claims -> `supported_offline` + `contradicted_offline` -> overall `contradicted_offline`.
2. **Software:** Synthetic billing service has failing tests but rollback available. Proposed deployment -> `blocked_conflict`, with external action denied.
3. **Decision:** Synthetic incident has an irreversible action and insufficient data, while a hold option exists. Two contradicted decision claims and one supported hold claim -> `contradicted_offline`; no action possible.

## Benefits and limitations

**Benefits actually measured:** atom-level auditability, explicit all-claims aggregation, typed mismatch checks, explicit unknowns, review-on-unparsed narrative and no-action semantics. Relative to the **extremely weak** first-claim baseline, these rules improve agreement on rule-targeted developer cases.

**Not measured:** realistic agent quality with/without plugin, language-understanding coverage, external data provenance, ability to detect undisclosed claims, digital-twin simulation, LogicNet or Wylo compute, user preference alignment, real-world intervention safety, economic return and model token/latency effects. The software and decision fixtures are artificial, not empirical organization data; the NBA world uses a small offline hand-curated catalog. The baseline can be improved by ordinary deterministic coding, so a high difference is not evidence of a unique moat.

**Important safety boundary:** If the user sends natural-language text, the engine does not pretend it has completely parsed that text. Unverified `input_text` forces review unless an independently established contradiction already exists. The current IR relies on external atomization; a model could omit an inconvenient clause, so no "every clause checked" claim is valid until coverage is independently measured. Source links, hashes, and agent-provided `verified` flags are never producer authentications.

## Decision / Go–No-Go

- **GO** for research integration and construction of an independently validated clause-coverage component, not for production deployment.
- **NO-GO** for claims of LLM cognitive improvement, human-level semantic understanding, independently authenticated citations, or system-wide Meta-Coherence.
- **Next gate**: provenance fetched and attested outside model trust boundary, clause-level NLP annotation (including Persian/German), cross-domain fresh test adjudication and real paired A/B/C with matched model settings and cost reports.

The ZIP contains no keys, no remote service credentials and no automated external actions. Do not publish as production-ready.
