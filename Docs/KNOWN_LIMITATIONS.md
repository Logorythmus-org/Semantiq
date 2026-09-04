# Known Limitations

## Implemented

- End-to-end local TypeScript MVP runtime.
- Versioned MVP event timeline.
- Dashboard snapshot.
- Portable export structure.
- Docker Compose service topology.
- MVP screen descriptors.

## Stubbed

- Web screens are route descriptors, not full UI views.
- Backend services expose health metadata and container scaffolds, not HTTP servers.
- Docker service commands are placeholders for local stack shape.

## Adapter-Ready

- SQLite local storage.
- PostgreSQL service persistence.
- Neo4j graph persistence.
- Redis cache/event integration.
- Meilisearch/OpenSearch search.
- ZIP export packaging.

## Not Implemented Yet

- Cloud provider integrations.
- Real authentication provider.
- Signed builds and release tags.
- Full Playwright browser journey.
- Coverage threshold enforcement.
- Production performance optimization.

## Implementation Cycle 1 Phase A Prompt 2

- Docker Compose syntax validates, but Docker runtime build/start was not verified because the local Docker daemon was unavailable.
- `pnpm build` runs successfully, but many app and service build scripts remain scaffold echoes.
- `pnpm lint` passes with two warnings in existing runtime files.
- Root-level formatting is scoped to the cleanup surface; historical docs and scaffold files are not reformatted in this sprint.
- No real backend HTTP service or health endpoint exists yet.

# Sprint 2 Known Limitations

- Question analysis is deterministic and heuristic.
- External AI providers are adapter-ready but not executed.
- Similarity does not use real embeddings yet.
- Evidence quality is not source verification or scientific peer review.
- ZIP export remains represented by package data rather than archive generation.
- UI screens are descriptors, not rendered React components.
- Persistent migrations are descriptors, not database-applied migrations.

## Sprint 4 Known Limitations

- Payment processing and financial settlement are not implemented.
- Cryptocurrency and NFT functionality are not implemented.
- Remote public marketplace is adapter-ready only.
- Cryptographic signing is an interface/placeholder.
- Malware, vulnerability, and secret scanning are adapter descriptors.
- Sandbox isolation is descriptor-level and not a strong OS-level guarantee.
- License metadata is not legal advice.
- Federation and remote package hosting are deferred.
- Publisher verification and trust scoring are limited local placeholders.

## Sprint 5 Known Limitations

- Federation is invitation-only in alpha.
- Public node discovery is disabled by default.
- Remote agent execution is severely constrained.
- Live collaborative editing is limited to safe shared-session metadata.
- No global routing or public relay network exists.
- No automatic trust establishment or decentralized consensus exists.
- Cryptographic metadata is not formally verified.
- Conflict resolution may require manual review.
- Search scale is limited to alpha test networks.
- Remote cache revocation cannot guarantee deletion outside controlled nodes.
- Offline packages require secure manual handling.

# Sprint 6 Public Alpha Limitations

- Public Alpha is not production SaaS.
- Federation is invitation-only and public node discovery is disabled.
- Remote agents are constrained.
- Marketplace behavior is local-first.
- Payments, cryptocurrency and NFT infrastructure are not implemented.
- Plugin sandbox limitations are documented and Safe Mode can disable plugins.
- AI outputs may be wrong; Semantiq scores are explainable but not absolute truth.
- GDPR and EU AI Act materials are readiness artifacts, not legal certification.
- Performance targets are alpha targets.
- Accessibility still requires manual review.
- Remote deletion cannot be guaranteed outside controlled nodes.
- Feedback requires manual triage.

# Sprint 7 Public Alpha Learning Limitations

- Tester cohort is small.
- Simulated findings do not generalize to all users.
- Alpha metrics are exploratory.
- AI-quality ratings are subjective.
- Semantiq validation is not scientific proof of universal validity.
- Federation remains invitation-only.
- Support capacity is limited.
- Public Alpha is not a production SLA service.
- Update and rollback paths require continued testing with real user data.
- Some workflows remain experimental.

# Sandbox Subsystem Boundaries & Known Limitations

- **Provider Neutrality & Independence**: SemantIQ Core owns provider-neutral contracts. Docker
  Engine execution is implemented with partial live-daemon validation; OpenSandbox is a partially
  validated protocol client; E2B is simulated; Podman, MicroVM, and named cloud-provider runtime
  compatibility is not verified.
- **Hardware & Latency Variance**: Provider/environment variance is recorded and normalized mathematically ($PVS$ and $PEP$), but physical host hardware differences across diverse cloud environments may not be fully removable.
- **Local Isolation Dependency**: Workstation rootless container isolation depends on the host OS container engine and security modules.
- **Subsystem Internal Gate vs Product Authorization**: Sandbox subsystem `INTERNAL GATE PASSED` status certifies contracts and unit tests only; whole-product release authorization requires Phase 11 clean-room extraction and Phase 12 release gates.
