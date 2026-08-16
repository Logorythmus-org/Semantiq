# Developer Experience Guide

Tech Club optimizes for fast, safe, and traceable production development.

## Developer Principles

- Start from Spec-Kit.
- Work in the smallest testable increment.
- Use package boundaries.
- Prefer adapters over rewrites.
- Keep local development offline-capable.
- Make failures observable.
- Update docs in the same change.

## Generators

Future generators will create packages, services, specs, components, agents, workflows, and repository docs from approved templates.

## Doctor Checks

Doctor checks validate tool versions, workspace package metadata, required docs, dependency graph, circular dependencies, and local service availability.

## Dependency Viewer

The package graph command is exposed through `pnpm techclub graph`.
