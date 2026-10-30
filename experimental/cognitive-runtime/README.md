# Experimental Cognitive Runtime — Phase 7

Read PHASE7_REPORT.md, MCP_VALIDATION_INCREMENT.md and EVALUATION_VALIDATION_INCREMENT.md before use. Run `python -m unittest discover -s tests -v`
and `python validate_frozen.py`. The historical benchmark.py retains its v0.1 freeze
guard and is not the updated evaluation entrypoint. No production/agent-host
compatibility or source authenticity is established.

# SemantIQ Cognitive Runtime — Phase 6 (research v0.1)

**Experimental offline Multi-Claim Semantic IR**. Python 3.10+ stdlib only. This package contains no real LogicNet, Wylo, Atlas of Questions or digital-twin implementation. It is not a general natural-language understanding system, a truth oracle, a certified MCP server, or an installed ChatGPT/Codex plugin.

## Scope

- Versioned structured claim packet: `domain`, `claims[]`, optional unparsed `input_text`, optional execution `intent`.
- Typed scalar comparisons and *all-claims* evaluation, preserving individual results and contradictions.
- Strict field allowlists, precise evidence IDs, conservative abstention for missing facts, unknown provenance, or unchecked free text.
- Global `action_allowed=false`; proposed external action with contradictions is `blocked_conflict`; unverified is `blocked_unverified`; remaining execution requests require human approval but are **not executed**.
- Three offline fixture domains: NBA (five game records inherited from Phase 5, **manually curated, not independently authenticated**); software (four **synthetic** services); decisions (four **synthetic** scenarios).
- Minimal read-only MCP JSON-RPC stdio subset supporting `initialize`, `ping`, `tools/list`, `tools/call`.

## Run

```bash
cd semantiq_cognitive_phase6
python semantic_ir.py < samples/nba_multi_claim.json
python semantic_ir.py < samples/software_multi_claim.json
python semantic_ir.py < samples/decision_multi_claim.json
python -m unittest discover -s tests -v
python benchmark.py
```

To invoke MCP stdio from a local agent host, launch `python /ABS/PATH/semantiq_cognitive_phase6/mcp_stdio.py` and call `semantiq_evaluate_claim_graph`. The initial server has no network listener or credentials; it is **not automatically installed** in any host. The transport uses newline-delimited JSON messages, as in the prior pilot; an independent MCP protocol conformance test is required before distribution.

## IR example

```json
{
  "version":"0.1", "domain":"nba",
  "claims":[
    {"id":"a","subject":"game:0022600138","predicate":"winner","operator":"eq","value":"HOU","evidence_ids":["nba:game:0022600138:winner"]},
    {"id":"b","subject":"game:0022600138","predicate":"margin","operator":"eq","value":40,"evidence_ids":["nba:game:0022600138:margin"]}
  ]
}
```

The first claim is `supported_offline`; the second is `contradicted_offline`, because margin is 32 in the curated record. **The overall verdict is contradicted.** The user-supplied free-form text itself cannot be authenticated; adding `input_text` causes `review` if no contradiction already exists.

## Reproduction and data boundaries

Run the tests and benchmark using the included `data/offline_facts.json` and `data/manifest.json`. SHA-256 inside the same bundle is a transport/integrity check, **not** independent provenance. Changing both file and hash demonstrably fools the engine. The primary 60-case benchmark was developer-designed; the 30 stress probes were also developer-designed and include three explicit world-poisoning controls. Evaluations are comparisons between deterministic code paths, **not** base model / structured prompting / model-with-MCP comparisons. No LLM calls, actual-world deployments or financial costs were recorded.

`build_store.py` describes the derivation of the initial fixtures and imports the old Phase 5 files for the NBA records; **it is not required to reproduce this self-contained ZIP**. `benchmark.py` uses the bundled facts and the engine-frozen hash at `outputs/v01_frozen_sha256.txt`.

## Files

- `semantic_ir.py`, `mcp_stdio.py`: runtime and minimal adapter
- `data/`: test-world facts, integrity manifest, packets and private gold labels for offline benchmark only
- `benchmark.py`, `tests/`: repeatable comparisons
- `samples/`: three demonstration cases
- `skills/semantiq-cognitive/SKILL.md`, `plugin.json`: preliminary distribution interfaces
- `outputs/`: benchmark metrics and case-by-case results
- `MODEL_AB_PROTOCOL.md`: fair model-level evaluation still to be performed
- `REPORT.md`: decisions, limitations, and follow-up gates

**No changes were pushed to GitHub.**
