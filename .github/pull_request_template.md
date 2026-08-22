## 1. Summary

<!-- Provide a concise description of the change, motivation, and associated issue/RFC links. -->

- **Type**: `feat` | `fix` | `refactor` | `docs` | `test` | `chore`
- **Domain**: `Core` | `Benchmark` | `Evidence` | `Governance` | `Python SDK` | `TypeScript SDK` | `Security` | `Docs` | `Release`
- **Issue / Spec Link**: #

---

## 2. Tests & Verification

<!-- Describe exact automated tests executed and attach evidence. -->

- [ ] TypeScript Unit / Integration Tests (`pnpm test`)
- [ ] Python Pytest Battery (`pnpm test:python`)
- [ ] TypeScript Typecheck (`pnpm typecheck`)
- [ ] Linter & Boundary Rules (`pnpm lint`, `pnpm test:boundaries`)
- [ ] Offline Deterministic Verification (`isOfflineDeterministic: true`)

---

## 3. Compatibility & Cross-Language Parity

- [ ] JSON Schema version compatibility preserved (`1.0.0`)
- [ ] TypeScript SDK (`@semantiq/sdk`) and Python package (`semantiq`) contracts remain 1:1 identical
- [ ] Backward compatibility maintained for existing benchmark run fixtures

---

## 4. Security & Privacy Impact

- [ ] Zero credential or private token leakage in traces or test fixtures
- [ ] All inputs sanitized against path traversal (`..` sanitization)
- [ ] Local-first execution preserved (no unapproved network egress)
- [ ] Threat model implications reviewed ([`Docs/security/threat_model.md`](https://github.com/Logorythmus-org/Semantiq/blob/main/Docs/security/threat_model.md))

---

## 5. Scientific Methodology & Behavioral Evidence Impact

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
