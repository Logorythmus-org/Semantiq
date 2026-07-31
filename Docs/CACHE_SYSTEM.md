# Cache System

Caching improves performance while preserving source-of-truth boundaries.

## Cache Types
- memory cache
- persistent cache
- workspace cache
- repository cache
- graph cache
- agent cache
- benchmark cache
- search cache
- offline cache

## Rules
Caches are disposable projections. Cache entries declare key, scope, owner, version, dependencies, expiration, and invalidation policy.

## Offline Cache
Offline cache stores enough read models and pending changes for local-first work. It must never bypass permissions or encryption policy.
