# Sentinel Security Journal

## 2025-05-18 - Unbounded JSON Streaming DoS and Missing CSP in Headless HTTP Router
**Vulnerability:** In `packages/semantiq/src/http/router.ts`, `readJsonBody(req)` accepted unbounded chunk streams without validating accumulated payload size, exposing the process to memory exhaustion Denial of Service (DoS) attacks. Furthermore, HTTP responses emitted by the router omitted the `content-security-policy` header present on canonical services.
**Learning:** While `services/api/src/server.ts` enforced a 64KB body bound and complete defense-in-depth headers, secondary or router implementations in library packages (`@logorythmus/semantiq`) did not mirror these guardrails.
**Prevention:** Standardize HTTP request stream size limits (`MAX_PAYLOAD_BYTES = 65536`) and security headers (`content-security-policy: default-src 'none'; frame-ancestors 'none'`) across all Node HTTP request handlers and routers.
