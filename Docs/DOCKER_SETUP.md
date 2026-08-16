# Docker Setup

The Docker Compose profile includes MVP service scaffolds and local infrastructure:

- web
- api-gateway
- identity
- workspace
- question
- graph
- semantiq
- research
- community
- agent-runtime
- workflow-runtime
- postgres
- neo4j
- redis
- docs
- monitoring through Prometheus and Grafana

Validate configuration:

```bash
docker compose config --quiet
```

Prompt 2 verified this syntax validation command locally.

Start locally:

```bash
docker compose up
```

The MVP service containers are scaffolds that keep the local stack shape visible while HTTP implementations are future work.

Prompt 2 did not verify image build, container startup, service health, or shutdown because the local Docker daemon was unavailable. Treat `docker compose up` as the intended workflow, not as a currently verified runtime result.
