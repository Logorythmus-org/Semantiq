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
