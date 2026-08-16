# Sandbox Isolation & Credential Scrubbing

- **Credential Scrubbing**: Automatic regex scrubbing removes API tokens and private keys from observable evidence traces.
- **Process Isolation**: Benchmarked code runs in ephemeral containers or isolated subprocesses.
- **Permission Boundaries**: Read-only workspace mounts prevent evaluated agents from modifying parent repositories.
