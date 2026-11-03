# Identity Migration Phase B — Internal pnpm Workspace Names

**Status:** Generated feature-branch migration completed; PR CI and maintainer review remain required.  
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
`--json`, `--apply`, and `--strict` modes. A one-time branch-specific workflow performed the guarded rewrite; it was
removed from the feature branch after recording its execution evidence.

## Deferred

- `TECHCLUB_*` environment compatibility aliases, database credentials,
  persisted directories and deployment secrets remain intact after Phase A.
- Published API/package names must use a versioned compatibility plan, not
  silent renaming. No historical tags are rewritten.
- A final audit of non-active/historical uses should classify each instance
  rather than claim every occurrence has disappeared.

## Generated migration evidence (2026-11-03)

- [Successful run 41709426924](https://github.com/Logorythmus-org/Semantiq/actions/runs/41709426924) applied the migration on branch `refactor/logorythmus-workspace-scope`.
- Initial scan: **174 workspace manifests**, **173 private packages** with legacy scope, **305 changed source/manifest files**, **337 package-name references**.
- The pinned pnpm resolver regenerated `pnpm-lock.yaml`; SHA-256 changed from
  `00ccce7c0c0c70dabd343681d893fb3a1a977abda815e21382afda4fb55de200`
  to `5a235d7384d81bffb896932391f3d8c2350d680021652d52930acbaf2c2df72b`.
- Both the initial and post-migration `pnpm install --frozen-lockfile` completed successfully in the same workflow. The migrator reports zero remaining *mapped* source references after rewriting.
- Two pre-migration references were not found in the first-party package map:
  `@tech-club/web-app` (obsolete CI filter, replaced with the actual
  `@logorythmus/app-playground` scaffold), and `@tech-club/sprint` (a
  deliberate **forbidden-parent-import detector** in the runtime boundary
  validator, kept alongside its modern `@logorythmus/sprint` form).
- This is a developer workspace migration, **not** proof of clean install from an
  npm registry, a deployed enterprise offering, or production readiness.

The final merge decision depends on all required checks passing at the final PR
head and independent review under the repository's branch-protection rules.
