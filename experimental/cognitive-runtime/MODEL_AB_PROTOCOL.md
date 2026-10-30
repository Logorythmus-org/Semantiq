# Phase 7 Gate — Real A/B/C Agent Trial (NOT EXECUTED)

For each of 30+ *externally adjudicated* tasks, use exactly the same underlying LLM, snapshot model, sampling settings, task definition, facts, and context window. Randomize task/arm order and use fresh sessions.

- **Arm A**: base model, factual task packet, no SemantIQ instructions/tools.
- **Arm B**: same model and facts, with explicitly structured prompting and clause-by-clause verification instructions, but no SemantIQ runtime.
- **Arm C**: same model and prompt as B, plus the actual SemantIQ MCP tool. Expose only read-only tools; the host must capture true tool-call evidence.

Measure correctness of independently judged conclusions, unsupported endorsement rate, abstention correctness, latency including tool trips, input/output tokens, direct monetary cost and extra context length. Calculate per-task paired outcomes (C–B is tool increment; B–A is prompting increment) with uncertainty intervals. Maintain disjoint preregistered task authors, solution writers and adjudicators. Test unknown games, non-English phrasing, damaged sources, version drift and source-poisoning.

**No current results:** `actual_model_calls = 0`, no Codex agent session invoked, no host attestations available, and no evidence of agent capability uplift. Do not interpolate measured Python microseconds into LLM latency.

First pass required: host-owned source retrieval/attestation and external ratings; a runtime in the model's own untrusted payload is insufficient. Tool invocation must be verified by host logs rather than the agent's self-report.
