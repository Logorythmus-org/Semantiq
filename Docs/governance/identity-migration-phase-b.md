# Identity Migration Phase B — Internal pnpm Workspace Names

**Status:** Planned guarded migration; requires actual PR CI and maintainer review.  
**Baseline:** protected `main` at `fc1624ff1af363aea4d5bd9e1357f410278d5219` after PR #248.  
**Issue:** #247 (SemantIQ / Logorythmus).

## Strict boundary

This phase migrates *private, first-party pnpm workspace* identities from
`@tech-club/*` to `@logorythmus/*`. The proposed names are a local
workspace namespace, **not** a verified registered or available npm scope.
No publication to npm, AWS Marketplace, or any package registry is authorized.

The independently named, potentially publishable `@semantiq/sdk` is intentionally
unchanged. If a project needs to ship these internal dependencies in the future,
package boundaries and publish-time packaging must be audited separately.

## Change process

1. Freeze exact base commit and create a separate feature branch from protected main.
2. Discover first-party workspace manifests from `apps/*`, `packages/*`,
   `services/*`, `tooling/*`, and `examples/*`.
3. Refuse automatic renaming of any non-private original package; refuse a
   destination name that already belongs to a workspace package.
4. Update only mapped package names and imports/references in *active* application,
   package, service, tool, script, test, plugin, example and workflow files.
   Existing `Docs/` archival records, historical `.changeset/` evidence,
   `fixtures/` and prior Git commits/tags are not rewritten.
5. Regenerate `pnpm-lock.yaml` through the pinned `pnpm@11.11.0` lockfile
   resolver, not by manually editing lockfile text.
6. Verify a frozen-lockfile install, tests for the migration script and the
   normal CI contract, security, SDK, Python and documentation gates.
7. Use review + protected branch rules before merging. Do not publish packages
   or change runtime data as a side-effect.

The generator is `scripts/migrate-internal-package-scope.mjs` and has
`--json`, `--apply`, and `--strict` modes. A one-time branch-specific workflow
performs the authorized guarded rewrite with a recorded migration artifact; the
workflow must be removed before merge.

## Deferred

- `TECHCLUB_*` environment compatibility aliases, database credentials,
  persisted directories and deployment secrets remain intact after Phase A.
- Published API/package names must use a versioned compatibility plan, not
  silent renaming. No historical tags are rewritten.
- A final audit of non-active/historical uses should classify each instance
  rather than claim every occurrence has disappeared.
