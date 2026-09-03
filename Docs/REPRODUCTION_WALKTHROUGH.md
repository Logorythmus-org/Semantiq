# Independent Replication Guide

**Status**: `REVIEWED`

**Scope**: Source-checkout reproduction and evidence submission

**Current external-replication status**: `NOT YET VERIFIED`

This is the canonical path for a third party to reproduce a SemantIQ run and submit the resulting
evidence for maintainer review. A submitted report—even one marked
`SUCCESSFUL_REPRODUCTION`—is an **external reproduction attempt**, not automatically a verified
external replication.

The current canonical first-result command is:

```bash
pnpm first-result
```

It produces `artifacts/first-result/semantiq-result.json`. That artifact remains classified as
`origin: internal`, `input: synthetic`, and `replicationStatus: not-independent-replication`
because those fields describe the owner-defined fixture and execution scaffold. Running it on an
independent machine does not rewrite the artifact's embedded classification; independence is
assessed from the submitted provenance.

## 1. Replication status model

Record exactly one attempt outcome:

| Status | Meaning |
| :--- | :--- |
| `SUCCESSFUL_REPRODUCTION` | The documented command completed and the observed artifact matched the stated expectation. This is not yet `VERIFIED_EXTERNAL_REPLICATION`. |
| `PARTIAL_REPRODUCTION` | Some documented stages or artifacts were reproduced, but at least one expected stage or output was not. |
| `DIVERGENT_RESULT` | The run completed but one or more outputs, hashes, scores, or behaviors differed. Preserve and report the divergence. |
| `BLOCKED_REPRODUCTION` | Setup or execution could not complete. Record the blocking step and its sanitized error output. |

Divergent, partial, and blocked attempts are useful evidence and must not be hidden by repeated
runs. Report both the first material divergence and any later retry.

## 2. Independence criteria

An attempt may be reviewed as independent only when all of the following are true:

- the reproducer is not a SemantIQ owner account acting on behalf of the project;
- execution occurs outside project-controlled CI and other owner-controlled infrastructure;
- the environment is administered independently of the SemantIQ project;
- the evidence is not an owner-controlled clean-room execution, bot rerun, or the same project
  environment presented as external;
- the submitted commit, environment, commands, artifacts, hashes, and material deviations are
  sufficiently complete to review.

Independence does not imply that a result is correct, causal, production-ready, certified, or
generalizable. Maintainers may accept the provenance while classifying the result as divergent,
partial, or blocked.

## 3. Fix the target and record the environment

Use a fresh source checkout. Replace `<commit-or-tag>` with the exact commit or release tag being
tested; do not rely on a moving branch name in the submitted record.

```bash
git clone https://github.com/Logorythmus-org/Semantiq.git
cd Semantiq
git checkout --detach <commit-or-tag>
git rev-parse HEAD
pnpm install --frozen-lockfile
```

Record the following before running SemantIQ:

- exact commit SHA and release tag, if any;
- SemantIQ software release version and product-contract schema version;
- operating system, architecture, and isolation method (for example a new VM, container, or
  separately administered workstation);
- `node --version` and `pnpm --version`;
- `python --version` when a Python surface is used;
- adapter/runtime name and version;
- timestamp with time zone;
- whether network access was enabled and every external service contacted;
- input classification (`synthetic`, `public`, `private-redacted`, or another explained class).

If a provider or model is involved, also record its provider, exact model/version identifier,
system-prompt or prompt-set identifier/hash, temperature, seed where supported, and other material
configuration. For `pnpm first-result`, record these fields as `not applicable`: it uses the local
synthetic scaffold and does not call a model or external service.

Do not submit proprietary prompts, private datasets, access tokens, credentials, or personal data.
A stable digest and a non-sensitive description may be used when the underlying material cannot be
shared; disclose that this limits independent review.

## 4. Run and preserve the result

Run the documented health check and first-result command without modifying the source:

```bash
pnpm doctor
pnpm first-result
```

Preserve:

- a sanitized command transcript including exit codes;
- `artifacts/first-result/semantiq-result.json`;
- the artifact's SHA-256 checksum;
- the environment metadata from the previous section;
- relevant sanitized logs;
- every deviation from these instructions.

The expected artifact contains the software release, Public Alpha maturity, schema version,
internal/synthetic evidence classification, deterministic scaffold payload, and explicit
limitations. It intentionally omits the runtime-generated report ID and timestamp.

## 5. Calculate and compare hashes

On Linux or macOS:

```bash
sha256sum artifacts/first-result/semantiq-result.json
```

On PowerShell:

```powershell
Get-FileHash artifacts/first-result/semantiq-result.json -Algorithm SHA256
```

To test byte determinism, save the first artifact under another name inside `artifacts/`, run
`pnpm first-result` again, and calculate both hashes. Record different hashes as
`DIVERGENT_RESULT`; do not edit either file to make them match.

## 6. Sanitize before submission

Review every transcript, artifact, and log before uploading it. Remove or replace:

- credentials, tokens, cookies, authorization headers, and private keys;
- local usernames, private filesystem paths, and unrelated environment variables;
- personal, customer, or proprietary input data;
- private endpoint URLs and request/response bodies.

State what was redacted and whether redaction prevents any check from being repeated. Do not send
secrets privately to maintainers as a substitute for sanitization.

## 7. Submit the attempt

Open an
[Independent Replication Report](https://github.com/Logorythmus-org/Semantiq/issues/new?template=independent_replication_report.yml)
and provide:

1. selected reproduction status;
2. exact commit/release, software version, and schema version;
3. environment, isolation, network, runtime, adapter, and optional model configuration;
4. command transcript and exit codes;
5. result artifact or a stable public link;
6. SHA-256 checksum and, when tested, the second-run checksum;
7. expected versus observed behavior and all divergences;
8. relevant sanitized logs and an explicit sanitization confirmation.

If GitHub cannot safely host an artifact, provide its checksum and a stable public retrieval link.
Do not upload confidential material merely to make a report complete.

## 8. Maintainer review and classification

Submission follows this workflow:

```text
submitted
  -> completeness check
  -> provenance and independence check
  -> reproduction-outcome classification
  -> accepted | needs-information | rejected-as-independent
```

- **Accepted** means the report is complete enough to retain with its reviewed outcome. It does
  not by itself promote a claim or prove scientific validity.
- **Needs information** means maintainers cannot yet assess provenance, independence, or the
  reported outcome.
- **Rejected as independent** means the attempt may remain useful internal or compatibility
  evidence, but it does not satisfy the independence criteria.

Only an accepted report whose provenance satisfies the independence criteria may later be labeled
`VERIFIED_EXTERNAL_REPLICATION`. Maintainer review must record that classification explicitly; an
issue title, submitter-selected status, successful hash comparison, or automated check cannot grant
it.

## 9. Evidence boundaries

- Reproduction demonstrates behavior in the recorded environment, not universal truth.
- Matching hashes demonstrate byte identity for the compared artifacts, not scientific validity.
- Integrity and provenance checks do not establish causality, safety, certification, adoption, or
  production readiness.
- No verified independent third-party replication is currently claimed by this repository.
