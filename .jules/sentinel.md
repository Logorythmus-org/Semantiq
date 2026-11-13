# Sentinel's Journal

## 2025-05-18 - HTTP API Missing CSP and Body Size Limits
**Vulnerability:** The SemantIQ headless HTTP router (`SemantiqHttpRouter`) omitted the `Content-Security-Policy` header and streamed JSON bodies into memory without a byte length limit, creating a risk of UI framing/injection and memory exhaustion denial-of-service (DoS).
**Learning:** Security headers like CSP and request payload limits were enforced in `services/api` but had not been standardized in `packages/semantiq/src/http/router.ts`.
**Prevention:** Always pair JSON streaming accumulators with maximum payload bounds (`MAX_BODY_SIZE_BYTES`) and ensure security headers (CSP, X-Content-Type-Options, X-Frame-Options) are applied consistently across all HTTP server surfaces.
