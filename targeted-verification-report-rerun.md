# Targeted Verification Report — Sealed Release Candidate Re-run

## 1. Verification Metadata — PASS

| Field                         | Evidence                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| Audit                         | Prompt 4.5-R independent targeted verification                                                   |
| Canonical repository          | `C:\Users\Kaveh\Desktop\SemantIQ-canonical`                                                      |
| Branch                        | `foundation/canonicalize-semantiq`                                                               |
| Sealed commit                 | `ead68154f29e9521da44386b807fea37a34af327`                                                       |
| Parent                        | `26372470a709d23686ef7c82c77911c6207f207b`                                                       |
| Audit date                    | 2026-07-27                                                                                       |
| Audit mode                    | Read-only against canonical repository                                                           |
| Generated validation location | `C:\Users\Kaveh\AppData\Local\Temp\semantiq-45r-48dd0e69bb604471a9afad8f76e8a2fa`                |
| Validation log                | `C:\Users\Kaveh\AppData\Local\Temp\semantiq-45r-48dd0e69bb604471a9afad8f76e8a2fa\validation.log` |
| Report location               | Outside canonical repository                                                                     |

The sealed tree was exported with `git archive HEAD` to a disposable directory. Tests, fixture creation, execution, evaluation, and dataset generation occurred there, not in the canonical repository.

## 2. Precondition Gate — PASS

The mandatory gate was evaluated before functional verification.

| Requirement               | Result | Evidence                                                              |
| ------------------------- | ------ | --------------------------------------------------------------------- |
| Repository path           | PASS   | `C:\Users\Kaveh\Desktop\SemantIQ-canonical`                           |
| Current branch            | PASS   | `foundation/canonicalize-semantiq`                                    |
| Exact HEAD                | PASS   | `ead68154f29e9521da44386b807fea37a34af327`                            |
| Exact parent              | PASS   | `26372470a709d23686ef7c82c77911c6207f207b`                            |
| Working tree              | PASS   | `git status --porcelain=v1 --untracked-files=all` returned no entries |
| Index                     | PASS   | `git diff --cached --name-only` returned no entries                   |
| Ordinary untracked files  | PASS   | none                                                                  |
| Merge conflicts           | PASS   | `git diff --name-only --diff-filter=U` returned no entries            |
| Release tags              | PASS   | `git tag --list` returned no entries                                  |
| Tracked ignored content   | PASS   | `git ls-files -ci --exclude-standard` returned no entries             |
| Push/publication evidence | PASS   | Push URL is `DISABLED`; no tag or publication action was performed    |

Ignored local directories physically exist, including `.venv`, caches, `artifacts`, `dist`, and `frontend`. This is permitted by the gate. None is tracked, staged, untracked in ordinary Git status, or present in Git-derived release contents.

The initial local Git remote configuration was recorded with SHA-256:

`8DC250254C5BEEDC85E4565FB95EBA4E3B5C31B443643D82767E489D1199C305`

## 3. Scope — PASS

The audit addressed only:

1. export licensing;
2. component metadata;
3. security and privacy truth;
4. current-document consistency;
5. targeted regression verification;
6. repository integrity.

No remediation, development, full-suite audit, tag, push, GitHub change, or publication was performed. Preservation repositories were not inspected.

## 4. Question 1 — Export Licensing — PASS

### Source evidence

- `src/semantiq/export/dataset_exporter.py:76` sets the legacy-compatible top-level `license` to `NOASSERTION`.
- `src/semantiq/export/dataset_exporter.py:78` sets `licensing.overall` to `NOASSERTION`.
- Lines 81–97 distinguish repository source, benchmark items, generated responses, AI evaluations, human ratings, exporter metadata, and third-party provider terms.
- Lines 82–94 use `NOASSERTION` only for an included component whose rights are not asserted, and `NOT_INCLUDED` when that component is absent.
- Lines 207–217 preserve supplied benchmark rights metadata; missing source/version becomes `UNKNOWN`, while missing license becomes `NOASSERTION`.
- Lines 272–280 generate a card that denies a blanket dataset license and reports every licensing component.

MIT is scoped to SemantIQ repository source and exporter-created metadata structure/explanatory text. It is not assigned to benchmark content, responses, evaluations, ratings, or third-party material.

### Approved synthetic export

Command:

`semantiq export-dataset --benchmarks benchmarks/synthetic-smoke.json --answers <answers> --evaluations <evaluations> --out-dir <approved-export>`

Exit status: `0`.

Generated evidence:

- overall and legacy status: `NOASSERTION`;
- repository source: `MIT`;
- benchmark `synthetic-clarity-001`: `CC0-1.0`;
- generated responses: explicit `NOASSERTION`;
- AI evaluations: explicit `NOASSERTION`;
- absent human ratings: `NOT_INCLUDED`;
- dataset card contains “does not grant a blanket dataset license”;
- dataset card contains no `CC BY 4.0` assertion.

### Mixed-component export

The disposable fixture intentionally omitted benchmark source, version, and license, included one human rating, and omitted answers/evaluations.

Command:

`semantiq export-dataset --benchmarks <mixed-benchmark> --human-ratings <mixed-ratings> --out-dir <mixed-export>`

Exit status: `0`.

Generated evidence:

- missing benchmark source: `UNKNOWN`;
- missing benchmark version: `UNKNOWN`;
- missing benchmark license: `NOASSERTION`;
- human ratings: explicit `NOASSERTION`;
- generated responses: `NOT_INCLUDED`;
- AI evaluations: `NOT_INCLUDED`;
- provider terms remain `NOASSERTION`;
- card contains all component statuses and no blanket license assertion.

The distinct meanings are implemented consistently:

- `UNKNOWN`: requested provenance fact is unavailable;
- `NOASSERTION`: exporter makes no license or rights claim;
- `NOT_INCLUDED`: component is absent from this export.

## 5. Question 2 — Component Metadata — PASS

`src/semantiq/schemas/dataset_metadata.py` and generated schema version `2.0` expose distinct fields for:

- repository source;
- per-benchmark source, license, and version;
- generated responses;
- AI evaluations;
- human ratings;
- exporter-created metadata;
- provider involvement and provider terms;
- machine-generated content;
- human contribution;
- input-rights verification;
- origin and source/version provenance.

Generated-output assertions all passed:

| Assertion                                    | Approved fixture | Mixed fixture |
| -------------------------------------------- | ---------------: | ------------: |
| Schema version `2.0`                         |             PASS |          PASS |
| Overall `NOASSERTION`                        |             PASS |          PASS |
| Input rights verified = false                |             PASS |          PASS |
| Benchmark source/license/version represented |             PASS |          PASS |
| Generated-response status represented        |             PASS |          PASS |
| AI-evaluation status represented             |             PASS |          PASS |
| Human-rating status represented              |             PASS |          PASS |
| Provider involvement/terms represented       |             PASS |          PASS |
| Machine-generated flag represented           |             PASS |          PASS |
| Human-contribution flag represented          |             PASS |          PASS |
| Every component visible in card              |             PASS |          PASS |

For the mixed export, `human_contribution` was `true` and `machine_generated_content` was `false`, matching the included and absent components.

## 6. Question 3 — Security and Privacy Truth — PASS

### Implementation evidence

- `src/semantiq/security/logging.py:19–30`: `sanitize_api_keys` masks recognized API-key-like patterns.
- `src/semantiq/security/logging.py:34–42`: email and phone masking occurs in `sanitize_user_generated_text`, only when explicitly invoked.
- `src/semantiq/security/logging.py:45–60`: `sanitize_model_response` recursively sanitizes provider metadata dictionaries.
- `src/semantiq/security/logging.py:63–71`: the central logging filter applies API-key masking, not automatic general PII removal.
- `src/semantiq/models/providers/openai_provider.py:57–64`, `openrouter_provider.py:64–71`, and `grok_provider.py:71–78`: network adapters store sanitized provider payloads in `raw_response` while storing extracted `answer_text` unchanged.
- `src/semantiq/schemas/human_evaluation.py:15`: `rater_id` is accepted as supplied; no automatic anonymization is implemented.

### Documentation comparison

Current documentation accurately states:

- provider metadata is sanitized where network-provider adapters apply the sanitizer;
- `answer_text` is stored unchanged;
- logger filters mask recognized API-key patterns;
- email/phone masking requires the specific helper;
- rater IDs are not automatically anonymized;
- stored and exported content can contain sensitive material;
- sanitizers are limited pattern-based helpers, not complete secret, PII, or content-safety protection.

Supporting current documents include `README.md:85`, `SECURITY.md:18–19`, `PRIVACY.md:9–21`, `KNOWN_LIMITATIONS.md:18`, `docs/architecture/current-architecture.md:17`, `docs/concepts/privacy.md:8–14`, `docs/concepts/security.md:14–16`, and `docs/reference/logging.md:10–19`.

No current claim says complete responses are sanitized before storage.

## 7. Question 4 — Documentation Consistency — PASS

The required current documents were read and searched:

- `README.md`
- `SECURITY.md`
- `PRIVACY.md`
- `KNOWN_LIMITATIONS.md`
- `RELEASE_POLICY.md`
- `RELEASE_CHECKLIST.md`
- `docs/architecture/current-architecture.md`
- `docs/concepts/privacy.md`
- `docs/concepts/security.md`
- `docs/reference/benchmarks.md`
- `docs/reference/file-formats.md`
- `docs/reference/logging.md`

Results:

| Topic                     | Result | Evidence                                                                                              |
| ------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| CC BY 4.0                 | PASS   | No operative current claim found                                                                      |
| Blanket dataset licensing | PASS   | README, release policy/checklist, formats, limitations, and generated card agree that none is granted |
| MIT coverage              | PASS   | Scoped to approved repository source and original documentation/exporter metadata where stated        |
| Benchmark licensing       | PASS   | Preserved per item; missing license becomes `NOASSERTION`                                             |
| Generated content         | PASS   | Responses/evaluations receive component status, not repository license                                |
| Human ratings             | PASS   | Separate status; documentation requires anonymization/review rather than claiming it is automatic     |
| Provider terms            | PASS   | Explicitly unverified and separately reported                                                         |
| Response sanitization     | PASS   | Metadata sanitization is distinguished from unchanged answer text                                     |
| Automatic PII removal     | PASS   | Explicitly disclaimed                                                                                 |
| Rater anonymization       | PASS   | Explicitly caller-controlled, not automatic                                                           |
| Metadata schema           | PASS   | Current documentation and generated output agree on `2.0`                                             |
| Export file formats       | PASS   | Generated JSONL files, metadata, card, and optional-component behavior match the current reference    |

The targeted stale-claim scan returned no matches for blanket `CC BY 4.0`, “responses sanitized before storage,” or automatic anonymization claims. Historical documentation was not treated as operative current policy.

## 8. Question 5 — Regression Verification — PASS

All commands operated on a `git archive HEAD` copy or disposable outputs.

| Verification                | Command summary                                                                                                                      | Exit/result                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| Targeted exporter tests     | `python -m pytest -q -p no:cacheprovider tests/test_dataset_exporter.py`                                                             | `0`; 2 passed, 1 expected warning |
| Offline mock run            | `semantiq run benchmarks/synthetic-smoke.json mock config/config.yaml <answers>`                                                     | `0`; 1 answer                     |
| Offline mock evaluation     | `semantiq evaluate <answers> <evaluations> --provider mock --config config/config.yaml --benchmarks benchmarks/synthetic-smoke.json` | `0`; 1 evaluation                 |
| Approved JSONL export       | `semantiq export-dataset ...`                                                                                                        | `0`                               |
| Mixed-component export      | `semantiq export-dataset --benchmarks <mixed> --human-ratings <ratings> ...`                                                         | `0`                               |
| Metadata assertions         | Programmatic checks of both `metadata.json` files                                                                                    | PASS                              |
| Dataset-card assertions     | Programmatic checks of both generated cards                                                                                          | PASS                              |
| Current-document stale scan | `Select-String` over the required current documents                                                                                  | PASS                              |
| Git whitespace validation   | `git diff-tree --check HEAD^ HEAD`                                                                                                   | `0`                               |

The one test warning reports that a unit fixture has no evaluation scores for one answer. It is expected by the targeted exporter test and is not a release-gate failure.

## 9. Question 6 — Repository Integrity — PASS

Final state was compared with the recorded initial state.

| Requirement                    | Final evidence                                                                |
| ------------------------------ | ----------------------------------------------------------------------------- |
| HEAD unchanged                 | `ead68154f29e9521da44386b807fea37a34af327`                                    |
| Parent unchanged               | `26372470a709d23686ef7c82c77911c6207f207b`                                    |
| Branch unchanged               | `foundation/canonicalize-semantiq`                                            |
| Working tree clean             | zero porcelain entries                                                        |
| Index clean                    | zero staged paths                                                             |
| Ordinary untracked files       | none                                                                          |
| Merge conflicts                | none                                                                          |
| Tracked ignored files          | none                                                                          |
| Generated repository artifacts | none                                                                          |
| Tags                           | none                                                                          |
| Remotes                        | unchanged                                                                     |
| Remote configuration hash      | unchanged: `8DC250254C5BEEDC85E4565FB95EBA4E3B5C31B443643D82767E489D1199C305` |
| Push                           | not performed; push URL remains `DISABLED`                                    |
| GitHub/publication action      | none performed                                                                |

The report is outside the canonical repository and does not affect its Git state.

## 10. Evidence Matrix

| Gate question                 | Status | Principal evidence                                                 |
| ----------------------------- | ------ | ------------------------------------------------------------------ |
| 1. Export Licensing           | PASS   | Exporter source plus approved and mixed generated outputs          |
| 2. Component Metadata         | PASS   | Schema `2.0`, both metadata files, both generated cards            |
| 3. Security and Privacy Truth | PASS   | Logging/provider/rating implementations compared with current docs |
| 4. Documentation Consistency  | PASS   | Full required-document review and stale-claim scan                 |
| 5. Regression Verification    | PASS   | All targeted commands exited `0`; assertions passed                |
| 6. Repository Integrity       | PASS   | Initial/final Git-state and remote-config comparison               |

No technical blocker or release-gate contradiction remains within this audit scope.

## 11. Remaining Human Conditions — WARNING

These are governance or authorization conditions, not failures of the six technical gates:

1. Configure a real private security-reporting route; `SECURITY.md` still marks this as a human decision.
2. Configure a real private conduct-reporting route; `CODE_OF_CONDUCT.md` still marks this as a human decision.
3. Confirm accountable maintainers and review ownership for the public repository.
4. Confirm organizational authority to offer the original synthetic fixture under CC0-1.0.
5. Complete any organization-required history-wide secret and provenance review before public remote integration.
6. Approve canonical remote integration and give explicit final human authorization before Prompt 5.

## 12. Final Verdict

**PASS WITH CONDITIONS**

All six technical questions pass. The sealed remediation is present, targeted validation succeeds, current documentation matches implementation, and repository integrity is unchanged. Only human governance and publication-authorization conditions remain.
