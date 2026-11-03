# Configuration

Configuration is typed, immutable after load, validated, and schema-versioned.

## Scopes
- environment
- workspace
- project
- user
- module
- plugin
- development
- production
- testing

## Rules
Configuration is injected into modules during configuration lifecycle. Modules must not read hidden globals. Secrets are referenced through secret handles, not raw values.

## Validation
Each configuration record declares a schema version and validation policy. Invalid configuration blocks startup for affected modules.

## SemantIQ runtime identity (migration phase A)

Use `SEMANTIQ_ENV` and `loadSemantiqConfig()` for the local baseline; use
`SEMANTIQ_PROFILE`, `SEMANTIQ_DATA_DIR`, `SEMANTIQ_NETWORK_DISABLED`, and
`loadSemantiqSettings()` for full runtime settings.

Older `TECHCLUB_*` keys and loader names remain supported temporarily for
existing users. Within a single source, the `SEMANTIQ_*` key wins; across
sources, explicit overrides win over environment values, which win over file
values and profile defaults. Historic data-directory defaults have **not** been
renamed automatically: existing persistence must be migrated separately and
backed up first. Do not rename database credentials or storage directories as
part of a cosmetic branding change.

See [runtime identity migration](governance/identity-migration-phase-a.md).
