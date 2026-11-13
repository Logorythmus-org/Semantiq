# Sentinel Security Journal

Critical learnings and codebase-specific vulnerability patterns.

## 2026-11-10 - Unbounded Request Body Size & Missing CSP on Headless HTTP Router

**Vulnerability:** In `SemantiqHttpRouter.readJsonBody`, incoming HTTP request payloads were read in chunks into an unbounded buffer array until `req.on("end")` without checking cumulative byte length. An attacker could stream gigabytes of payload data, exhausting heap memory and causing a denial of service (DoS) crash. Additionally, `content-security-policy` was missing across headless HTTP responses, differing from `services/api`.
**Learning:** Standalone HTTP servers implementing custom Node.js `IncomingMessage` streams often omit chunk-by-chunk length checks in body parsers while only checking limits after string conversion or JSON parsing, leaving the process vulnerable to memory exhaustion.
**Prevention:** Bound cumulative chunk byte size on the stream level (`req.on("data")`), pausing/detaching stream listeners and failing early when maximum thresholds (e.g., 64KB) are breached. Ensure uniform security headers (CSP, frame options, nosniff) are set consistently across all HTTP servers in monorepo packages.
