# Roadmap

SemantIQ is currently **`0.1.0-alpha.2` — Public Alpha (Experimental)**.

## Current repository-readiness roadmap

The active GitHub-side repository professionalization program is tracked in
[issue #84](https://github.com/Logorythmus-org/Semantiq/issues/84). Its sequence is:

1. workflow and branch hygiene;
2. bounded issue and documentation hygiene;
3. GitHub governance truth;
4. public documentation and landing-surface reconciliation;
5. release-surface reconciliation;
6. startup-readiness evidence.

This sequence is about repository truth and public readiness. It is not a product
feature commitment and does not imply production readiness.

## Near-term delivery track: runnable SemantIQ (27 Oct–3 Nov 2026)

This is a **bounded engineering delivery track**, not a declaration of
production readiness or a replacement for the canonical product-roadmap
approval gate in [#177](https://github.com/Logorythmus-org/Semantiq/issues/177).

The priority is to move from owner-controlled source and CI into an
**independently repeatable local execution path**, then stage reproducible
delivery artifacts before considering public deployment. These milestones
are evidence gates, not date-guaranteed release commitments.

| Horizon | Delivery item | Evidence / acceptance gate | Current state |
| --- | --- | --- | --- |
| NOW | Headless SemantIQ container (not legacy Tech Club Question API) | Dedicated local image, loopback-only Compose, live `/health` and `/info` smoke, corresponding CI logs | Experimental implementation under review in [Draft PR #231](https://github.com/Logorythmus-org/Semantiq/pull/231); no production claim |
| NOW | Security and runtime boundary | Reconcile payload-limiting PRs [#223](https://github.com/Logorythmus-org/Semantiq/pull/223), [#224](https://github.com/Logorythmus-org/Semantiq/pull/224), [#229](https://github.com/Logorythmus-org/Semantiq/pull/229), [#230](https://github.com/Logorythmus-org/Semantiq/pull/230); required checks and CODEOWNER review | Open; block public API exposure |
| NEXT | Build-only delivery workflow | Build a versioned candidate image, report SHA/digest, scan and retain build evidence; do not push or deploy yet | Not implemented or verified in current public CI |
| NEXT | Approved CD to GHCR / local install | Explicit maintainer approval, least-privilege token, immutable artifact, rollback plan and tested promotion gates | Gated; no registry publication authorized |
| NEXT | Documentation site delivery | Build existing `dist/docs` output, validate links, prepare preview and review GitHub Pages settings before any public publish | Static docs build is implemented; public Pages deployment not verified |
| NEXT | Local evidence viewer | Minimal local, read-only UI fed by actual evidence JSON with clear evidence provenance and mock/real labeling | Proposed; existing `apps/web` is only a shell |
| NEXT | WEP technical demonstration | Repeatable local API start, successful smoke logs, documented limitations and German founder briefing | In preparation for 3 Nov 2026 |
| LATER | Internet-facing API, multi-tenant service, service-level commitments | Security hardening, external deployment trials, operational monitoring, auth, backups, disaster recovery and performance evidence | Not validated; not a current release promise |

**Guardrails:** SemantIQ software remains `0.1.0-alpha.2` Public Alpha
(Experimental). Internal CI or local container smoke does not establish
production reliability, independent replication, third-party adoption, or
a published package. A future published platform must retain the
[known limitations](Docs/KNOWN_LIMITATIONS.md) and
[versioning policy](Docs/VERSIONING_POLICY.md). External reproduction
and provider compatibility are separately tracked under
[#165](https://github.com/Logorythmus-org/Semantiq/issues/165) and
[#167](https://github.com/Logorythmus-org/Semantiq/issues/167);
community onboarding under [#151](https://github.com/Logorythmus-org/Semantiq/issues/151).

## Product roadmap status

A current canonical public product roadmap will be published only after the
source/package-boundary audit is stable enough to distinguish active SemantIQ
components from legacy, optional, migration-bound, or out-of-scope code.

Existing broad phase, sprint, and platform roadmap documents in `Docs/` are
planning or historical material unless a current public document explicitly
promotes them. They must not be used to infer that every described subsystem is
implemented, supported, externally validated, or committed for release.

Current maturity and release boundaries are defined by:

- [Versioning & Release Policy](Docs/VERSIONING_POLICY.md)
- [Known Limitations](Docs/KNOWN_LIMITATIONS.md)
- [Public Claim Status](Docs/ecosystem/PUBLIC_CLAIM_STATUS.md)
