## 1. Contribution Path & Summary

<!-- Select exactly one path. See CONTRIBUTING.md. -->

- [ ] **Fast contribution path** — bounded documentation, example, typo/link, small-test, reproduction/compatibility, or non-semantic fix
- [ ] **Core change path** — architecture, benchmark semantics, scoring/evidence logic, scientific claims, governance, security-sensitive behavior, release-critical contract, or breaking API change

<!-- Provide a concise description of the change and motivation. A prior issue or specification is not required for Fast-path work. Core changes must link the governing issue/specification/RFC when the applicable process requires one. -->

- **Type**: `feat` | `fix` | `refactor` | `docs` | `test` | `chore`
- **Domain**: `Core` | `Benchmark` | `Evidence` | `Governance` | `Python SDK` | `TypeScript SDK` | `Security` | `Docs` | `Release`
- **Issue / Spec / RFC Link**: N/A for bounded Fast-path work; otherwise #
- **Why this path applies**:

---

## 2. Tests & Verification

<!-- Describe exact commands and outcomes. Select only applicable checks and explain any required check that was not run locally. CI remains authoritative for both paths. -->

- [ ] TypeScript Unit / Integration Tests (`pnpm test`)
- [ ] Python Pytest Battery (`pnpm test:python`)
- [ ] TypeScript Typecheck (`pnpm typecheck`)
- [ ] Linter & Boundary Rules (`pnpm lint`, `pnpm test:boundaries`)
- [ ] Offline Deterministic Verification (`isOfflineDeterministic: true`)

---

## 3. Compatibility & Cross-Language Parity

<!-- Fast-path contributors may write "Not applicable — <reason>" when the change cannot affect this surface. Core changes must complete every applicable item. -->

- [ ] JSON Schema version compatibility preserved (`1.0.0`)
- [ ] TypeScript SDK (`@semantiq/sdk`) and Python package (`semantiq`) contracts remain 1:1 identical
- [ ] Backward compatibility maintained for existing benchmark run fixtures

---

## 4. Security & Privacy Impact

<!-- Fast-path contributors may write "Not applicable — <reason>" when the change cannot affect this surface. Never include secrets, credentials, or private data. -->

- [ ] Zero credential or private token leakage in traces or test fixtures
- [ ] All inputs sanitized against path traversal (`..` sanitization)
- [ ] Local-first execution preserved (no unapproved network egress)
- [ ] Threat model implications reviewed ([`Docs/security/threat_model.md`](https://github.com/Logorythmus-org/Semantiq/blob/main/Docs/security/threat_model.md))

---

## 5. Scientific Methodology & Behavioral Evidence Impact

<!-- Fast-path contributors may write "Not applicable — <reason>" when no scientific claim, benchmark meaning, scoring, or evidence behavior changes. Core scientific changes require the applicable specification and review. -->

- [ ] **Controlled Language Compliance**: No unsupported causal language (`causes`, `proves`, `guarantees`, `eliminates`) introduced.
- [ ] **Epistemic Invariants**: `Observed ≠ Inferred`, `Matched Association ≠ Causal Effect`, `Absence ≠ Counterevidence` upheld.
- [ ] **Missing-Data Behavior**: Tolerance ($\le 20\%$) and explicit reason codes respected.

---

## 6. Documentation & Guides

- [ ] Architecture / Workflow documentation updated in `Docs/`
- [ ] SDK guide / CLI reference updated where applicable
- [ ] Changes recorded in `walkthrough.md` or release notes

---

## 7. Migration Impact & Breaking Changes

- **Breaking Change**: Yes [ ] / No [ ]
- **Migration Instructions**: N/A (or details if schema/API was updated)

---

## 8. Review Readiness

- [ ] The diff is focused and excludes unrelated changes.
- [ ] Exact validation commands and outcomes are recorded above.
- [ ] Required CI and CODEOWNER review will not be bypassed.
