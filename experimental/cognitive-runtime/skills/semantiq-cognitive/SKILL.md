---
name: semantiq-cognitive
description: Evaluate structured multi-claim statements against an offline evidence fixture, surface contradictions and unknowns, and prepare human-review records. Use for controlled semantic validation; never claim truth certification.
---

# SemantIQ Cognitive Research Skill (Phase 6)

This skill is **experimental**. It requires an available Python execution environment, the files in this bundle, and explicit user authorization for any installation. It is not installed in ChatGPT/Codex merely because this folder exists.

## Procedure

1. Separate every explicit assertion from the user-visible problem. Record each as a typed claim with `subject`, `predicate`, `operator`, `value`, and `evidence_ids` (see `samples/` and `data/offline_facts.json`).
2. Do **not** infer evidence identifiers from guesses. The offline fixture only supports curated NBA facts and synthetic software/decision cases. A URL or label is not independent authentication.
3. Pass a versioned claim packet to tool `semantiq_evaluate_claim_graph` in the local MCP server, or run `semantic_ir.py` with the packet JSON on stdin.
4. Inspect **all** atomic verdicts, contradictions, unresolved IDs and data limitations. Never treat `supported_offline` as verified real-world truth.
5. If any part of original natural-language wording has not been independently atomized and checked, include `input_text` and retain its `review` result. Do not use this tool to imply complete language understanding.
6. On proposed execution, permission change, destructive action or external effect, use `intent: execute`; this tool cannot authorize the action. Require explicit human approval and separate host-side enforcement.
7. Report the most important remaining uncertainty, counterevidence, and why the chosen validation method is limited. A non-answer or `review` is acceptable.

## Limitations

No natural-language semantic parser, no independently verified provenance, no LogicNet or Wylo implementation, no real digital twin, no LLM benchmark execution, no side effects. MCP implementation is a small stdio subset, not certified as conformant.
