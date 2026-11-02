# Sentinel Security Journal

## 2025-05-18 - HTTP Request Body Size Enforcement

**Vulnerability:** In `packages/semantiq/src/http/router.ts`, `readJsonBody` streamed incoming HTTP chunks into an unbounded memory buffer before parsing JSON, exposing the headless API server to memory exhaustion and denial-of-service (DoS) via oversized requests.
**Learning:** While the primary API server (`services/api/src/server.ts`) implemented body size limits (64KB), the standalone package router (`packages/semantiq/src/http/router.ts`) lacked payload size bounds during stream ingestion.
**Prevention:** Always enforce a bounded payload limit (`MAX_REQUEST_BODY_SIZE_BYTES`) on stream chunk accumulation in all HTTP routers across packages.
