# Dependency Injection

Dependency injection makes dependencies explicit and replaceable.

## Lifecycles
- Singleton: one instance per kernel.
- Scoped: one instance per runtime scope, such as request, workflow, or session.
- Transient: new instance for every resolution.
- Lazy: resolved only when first used.
- Factory: created by a registered function.
- Named service: multiple implementations behind one token.
- Configuration injection: typed configuration passed explicitly.

## Rules
- Modules declare dependencies in registration metadata.
- Constructors and factories receive interfaces, never global services.
- Domain packages do not resolve dependencies directly from hidden globals.
- Service cycles are invalid unless broken by explicit lazy providers.
