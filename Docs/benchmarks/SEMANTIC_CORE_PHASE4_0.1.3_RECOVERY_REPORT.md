# Phase 4.2 recovery — protocol 0.1.3

Qualification remains `INSUFFICIENT_EVIDENCE`. Public maturity remains BM2, scientific status `UNVALIDATED_PROXY`, and Core status `NOT_PROMOTED`. Zero protocol 0.1.3 benchmark attempts have been sent.

The preserved `fixtures/semantic-core-qualification-0.1.3/canary-D.json` records one synthetic engineering request: HTTP 200, selected `apodex/apodex-1.1-mini:free`, advertised canonical slug `apodex/apodex-1.1-mini-20261001`, Novita, reported cost exactly zero, and no embedded provider error. Exact message content passes local JSON parsing and canonical synthetic validation; network-free replay matches. Its content SHA-256 is `5585584936c5d66833d5205627dff4e7e3e2ccdbb5bc76cadc71795c4294e4cd`. Canary D is engineering evidence only and establishes no benchmark execution, S05 reliability, model accuracy, scientific validity or BM3 qualification.

The 0.1.3 serializer omits `response_format`, reasoning parameters and tools. It pins the eligible Novita provider with fallback disabled and prompt/completion price ceilings of zero. Only `message.content` is parsed with `JSON.parse`, then checked against the canonical response schema and case/option identities. No extraction, fuzzy inference, repair or replacement retry is allowed. Provider reasoning fields are discarded. Model accuracy is not a BM3 gate; infrastructure and evidence-integrity failures remain blockers.

The prospective plan remains three complete runs of 24 independent requests, in the same case order and request condition, across eligible quota windows within 168 hours. A fresh live route and quota preflight is required before every complete run. The recovery task sends no generation requests and does not start Run 1.

The exact resolved lock path ends in `.git/worktrees/phase4-semantic-core-qualification/index.lock`. Inspection found no lock and no merge, rebase, cherry-pick, revert or bisect marker. Process inspection found only Git fsmonitor daemons. Sandbox ACLs deny writing Git metadata; the repository owner retains full control. No file deletion, ACL change, ownership change or process termination is needed. Authorized Git operations use the normal user outside the sandbox.

`scripts/semantic-core-freeze-0.1.3.ts --output <absolute external directory>` requires an entirely clean worktree, committed Canary D, exact Canary replay, byte-identical historical 0.1.0/0.1.1/0.1.2 fixtures, and the exact pushed OPEN Draft PR #166 head with all 12 current-head checks successful. It freezes source commit/tree, protocol/serializer/parser, route configuration, all 24 case and prompt digests, evaluator/configuration and metric identities, quota/run/retry policy. It emits `condition.json` and `source-clearance.json` outside the worktree, preserving the clean validated source. No generation transport is imported. Endpoint metadata is explicitly attributed to Canary D; this prospective freeze does not replace the mandatory fresh live preflight before empirical collection.

The generated source-clearance record and accompanying recovery report contain the actual source SHA/tree, exact PR head, current-head check results, individual historical artifact hashes and condition digest. These outputs are created only after commit, push and observed CI success. Prior CI on `d08b983a059af3d68487230d8ec740e1df890e01` does not clear the new source.

Historical fixtures and reports remain unchanged. The root cause of the prior provider-native structured-output rejection remains unresolved. Local strict parsing does not establish that the provider lacks structured-output support.

PR #166 remains Draft. No ready-for-review action, merge, BM3 promotion, BM4, BM5, leaderboard, Cyber work or release is authorized by this recovery.
