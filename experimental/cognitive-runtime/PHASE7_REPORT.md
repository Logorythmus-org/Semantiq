# Phase 7 Engineering Validation — 2026-10-30

Status: experimental import; focused validation passed; full integration gate pending.
Tracking: https://github.com/Logorythmus-org/Semantiq/issues/241

## Source and environment

Source: attached `semantiq_cognitive_phase6.zip`, SHA-256
`32c420c83a5e5a50b82be76a2a425dbd88ec8b692947742a6a33ea2954014a05`.
All 24 entries in its manifest matched. The manifest excludes volatile outputs;
it is a consistency check, not a signed provenance statement. Archive member paths
and Unix symlink flags were checked before extraction. Original bytes are retained.
The first benchmark rewrote fixtures and outputs; original bytes were restored
from the ZIP before independent frozen-file replay.

Python 3.12.14, Git and Codex CLI 0.166.0-alpha.1 were available. No third-party
runtime dependencies were installed. An isolated uv virtual environment was created.
Offline pytest installation failed because it was absent from cache. Docker and
Ollama were not present. The managed-environment status tool was not exposed and
`/etc/codex/network-policy.json` was absent. GitHub clone and connector access worked;
this does not establish arbitrary network access. Do not infer available model IDs
or free inference from the authenticated Codex login.

## Executed original reproduction

- `python -m unittest discover -s tests -v`: 13 passed.
- `python benchmark.py`: main 60/60, stress 27/30, combined 87/90.
- Read-only replay of archived JSONL cases and separate gold files: 87/90.
- Three sample JSON packets through the CLI: NBA contradicted_offline, software
  blocked_conflict, decision contradicted_offline. All processes exited 0.
- The original suite executed 30 evaluation tool calls plus initialize/discovery
  in an external Python process and checked direct/runtime agreement; malformed
  JSON was also tested. This is subprocess testing, not an agent-host invocation.

The three failures are STRESS-nba-10, STRESS-software-10 and STRESS-decision-10.
Each changes a reference value and rewrites its adjacent hash. v0.1 accepts the
attacker's replacement world. Hash integrity is not publisher authenticity.
The baseline is a deliberately naive first-claim comparator (30/90), not an LLM.
Labels are developer-authored, not independently adjudicated. No scientific
replication or general semantic-understanding claim follows from this exercise.

## Implemented engineering increment

The separate runtime copy accepts packet versions 0.1 and 0.2. It pins the fixture
hash in trusted code, rejects malformed domain/intent, explicit null narrative,
missing values and non-JSON Python scalar types with InvalidInput, and checks all
previous equalities for a target rather than just the immediately previous claim.
The MCP adapter validates request IDs/methods/params, preserves false/null invalid
arguments rather than silently replacing them with {}, and drains oversized lines
using bounded reads before continuing. A new v0.2 schema is supplied.

21 focused tests passed, including eight new regression tests. The revised legacy
poisoning test now expects IntegrityFailure. The old test name is historical.
Frozen-file evaluation reports 90/90 only when integrity rejection is mapped to
`review` by the evaluator. The engine raises IntegrityFailure on load; it does not
return a semantic review verdict for a poisoned store. This is a repair on known
cases, not held-out performance. No claim extraction, temporal inference, general
constraint solver or independent source authentication was implemented.

## Categorized issue register

| ID | Severity | Reproduction / evidence | Status |
| --- | --- | --- | --- |
| P7-01 | High | Rewrite offline_facts value and manifest; v0.1 poison cases become supported_offline | Fixed for data-only tampering by code-controlled pin; code/publisher compromise remains |
| P7-02 | High | Evaluate packet with domain=[] or intent={}; v0.1 raises unhandled TypeError | Fixed with typed validation; process regression test |
| P7-03 | Medium | Unknown target: eq A, neq C, eq B; v0.1 loses nonadjacent equality conflict | Fixed for equality pairs; general inequalities remain incomplete |
| P7-04 | Medium | Explicit input_text=null passes runtime despite schema string requirement | Fixed |
| P7-05 | Medium | tools/call capabilities arguments=false or params=[] can be normalized to empty | Fixed; malformed request tests |
| P7-06 | Medium | Feed a huge line; original iteration allocates the whole line before checking | Bounded reader implemented and recovery tested |
| P7-07 | High research boundary | Caller omits a clause from IR; no certified extraction coverage | Open; nonempty narrative still forces review |
| P7-08 | High research boundary | Valid fixture IDs reference curated/synthetic assertions, not independent evidence | Open; pin cannot establish real-world truth |
| P7-09 | Medium | Time-dependent assertion has no as-of/expiry eligibility contract | Open; offline-relative only |
| P7-10 | Medium | benchmark.py regenerates labels and fixtures while evaluating | New frozen reader supplied; original retained |
| P7-11 | Medium | MCP protocol version is hardcoded; lifecycle negotiation and official conformance unverified | Open; adapter remains experimental subset |
| P7-12 | Medium | plugin metadata declares MIT but source ZIP has no LICENSE file | Repository MIT inspected; import attribution/data rights still require review |
| P7-13 | Medium | Runtime facts remain mutable in trusted Python process | Open; callers with in-process mutation authority are outside data-only threat model |
| P7-14 | Medium | No externally adjudicated A/B/C dataset or paid model authorization | Blocked model comparison; no calls made |

No-action remains `action_allowed=false`; this reports evaluator intent and does
not enforce a host sandbox. Prompt-like narrative stays unverified and cannot
upgrade source trust. Meta-Coherence is limited to bounded typed claims,
conjunction, equality conflicts and explicit unknowns, not a completeness claim.

## Agent and compatibility verification

Codex's `mcp get` accepted an enabled stdio entry supplied through per-command
configuration overrides. This verifies configuration parsing only; it does not
prove host startup, tool discovery by a model, selection or invocation. The Skill
is retained as experimental source, not installed or host-verified. No inference
was attempted and no paid calls were made. A/B/C correctness, false acceptance,
false rejection, abstention, latency, tokens and cost have no measured model data.
The supplied MODEL_AB_PROTOCOL.md remains the protocol. compare_recorded.py validates matching model/settings and complete case IDs for three arms, computes confusion/abstention metrics, and leaves missing telemetry null. Its synthetic unit test verifies the runner only; no inference comparison is claimed.

Repository main inspected at dd24677db17953586ae230e0647430e1176fd73c.
No Cognitive Runtime/semantic_ir implementation was found in packages/plugins/services;
semantiq-lite is an existing distinct adapter. Proposed path is
`experimental/cognitive-runtime`, outside existing API/package exports.
Packet v0.2 adds a version tag and validation hardening, not a new semantic model.
No existing public schema/API version changes. Python 3.10 compatibility is intended
by syntax but only 3.12 was executed. Repository Python tests could not start:
pytest is unavailable. Full pnpm/TypeScript/docs checks have not passed here.
Draft review and CI are required before any merge; this report is not that gate.

## Phase 8 prioritized backlog

1. Complete repository CI and maintainer review under issue #241; settle attribution
   and fixture rights before enabling distribution.
2. MCP lifecycle, version negotiation, tool-error semantics, strict JSON and official
   SDK conformance; real Codex host startup and discovery without inferring success.
3. Externally reviewed as-of/provenance contracts; authenticate publishers separately
   from release pins. Fail closed for unsupported source classes.
4. Bounded clause-to-IR coverage contracts with omission/adversarial tests. Keep
   natural-language extraction unverified until independently evaluated.
5. Entity/relation and inequality consistency with explicit temporal semantics.
6. Independently labeled holdout A/B/C protocol, identical model/settings, approved
   inference budget, recording tokens, latency, errors, abstention and tool overhead.
7. Expand resource/depth limits, store validation, immutable runtime data and fuzzing;
   do not present a Python boolean as a production enforcement boundary.

## Continuation checkpoint

Run original tests from original/semantiq_cognitive_phase6. For updated validation:
`cd runtime && python -m unittest discover -s tests -v && python validate_frozen.py`.
Do not run the historical benchmark against modified semantic_ir.py: its original
freeze guard intentionally rejects that engine. Continue from issue #241 and the
feature branch feat/cognitive-runtime-validation; no main push, merge or release is authorized. Inspect evidence/
for exact logs. Preserve this checkpoint and the original archive across sessions.

Git CLI push dry-run failed because no HTTPS username was configured. The connected GitHub API is used for the draft branch. Codex registration was a per-command override, not a persistent install.

Repository pnpm offline frozen install failed: ERR_PNPM_NO_OFFLINE_META for @ampproject/remapping. Root CI checks therefore remain unexecuted, not passed.
