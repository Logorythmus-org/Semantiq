# MCP lifecycle hardening — 2026-10-30

Scope: continuation of issue #241 / draft PR #242. Experimental; no release or merge.

## Completed baseline gate

GitHub workflows for baseline commit `02e13b247aba6ff2f380d77cbe8ab00155ced627`
all completed successfully: CI (41065749195), Security (41065749244), Documentation
Site (41065749256), and Experimental Cognitive Runtime (41065749298). The latter
ran contracts and archived-case replay under Python 3.10, 3.11 and 3.12.
This supersedes the original report's pending-CI checkpoint, not its historical
local dependency failures. New commit checks must pass separately.

## Implemented behavior

- Enforce NEW -> INITIALIZING -> READY using initialize and notifications/initialized.
- Require client version, capabilities and client implementation metadata.
- Negotiate the sole supported protocol 2025-06-18, returning that version when
  the client proposes another; a client unable to use it must disconnect.
- Reject tool discovery/invocation before readiness. Ping remains available.
- Advertise actual packet schemas accepting 0.1 and 0.2 rather than an empty object.
- Report server implementation version 0.2.0 consistently with plugin metadata.
- Reject duplicate JSON keys, non-standard and overflowing non-finite numbers,
  invalid UTF-8, nesting beyond 64 and frames beyond 128 KiB. Continue after a bad frame.
- Reject null/boolean/fractional request IDs; avoid reflecting exception contents.
- Return defensive copies of tool metadata so callers cannot mutate future discovery.
- Keep unknown tools and invalid parameters as JSON-RPC errors. No new external
  execution mode, model inference, publisher authentication or action authority.

Compatibility note: former toy clients that omitted the initialization handshake
must now send a complete initialize request followed by notifications/initialized.
The older regression client was corrected to exercise this real lifecycle; its
30 tool evaluations remain present. JSON-RPC-only ping smoke tests still work.

## Executed checks

31 unittest tests passed locally on Python 3.12.14, including ten lifecycle/parser
regressions. Three sample packet outputs match direct evaluation and JSON text
matches structuredContent. Archived-case replay remains 90/90 on known contracts,
with fixture-integrity rejection mapped to review by the evaluator. No new held-out
semantic performance or source-authenticity claim is made.

## Actual host probe: blocked

Read official OpenAI App Server guidance and generated the installed CLI's protocol
schemas. Attempted to launch Codex app-server without starting any inference turn.
Default launch failed to initialize its SQLite runtime under /home/agent/.codex.
An isolated sqlite_home override, after directory creation, passed that point but
startup still failed with `Read-only file system (os error 30)`. No global trust,
authentication or managed configuration was modified. No model turn was started.
Consequently actual host discovery, selection and tool invocation remain unverified.
The launch failure must not be treated as a SemantIQ engine failure or host success.
The probe is not an A/B/C inference result and no paid model request was made.

## References and remaining gate

- https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle
- https://modelcontextprotocol.io/specification/2025-06-18/server/tools
- https://learn.chatgpt.com/docs/app-server

This is a tested subset, not official MCP conformance certification. Next: complete
CI for this increment, obtain a writable supported Codex runtime for a host probe,
and settle source/data attribution and independently adjudicated test cases before
an approved inference trial. Keep draft status and do not merge or release.
