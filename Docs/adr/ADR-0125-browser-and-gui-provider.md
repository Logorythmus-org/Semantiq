# ADR-0125: Provider-Neutral Browser and GUI Execution Provider

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

Evaluating browser-based and graphical UI agent benchmarks requires standard action dispatch (clicking, typing, navigating, scrolling), screenshot capture, DOM tree inspection, and console log tracking. SemantIQ must support multiple underlying engines (Chromium, Firefox, WebKit, Virtual X11) without hardcoding proprietary driver APIs or compromising test isolation.

---

## Decision

1. **Standard GUI Action Model**: Define `BrowserGuiSpec` and `GuiActionRequest` contracts in `packages/sandbox-contracts/src/browser-gui.ts`.
2. **Normalized Evidence Generation**: Map all GUI interactions to `GuiObservationEvent` capturing screenshot SHA256 hashes, DOM hashes, and console errors.
3. **Sandbox Confinement**: Browser execution runs inside isolated sandbox containers/microVMs with configurable network policies and resource limits.
4. **Deterministic Visual Evaluation**: Enforce explicit viewport dimensions, device scale factors, and font/locale settings for cross-platform visual consistency.

---

## Consequences

- Web and desktop GUI agent benchmarks can run interchangeably on local or cloud runtimes.
- Visual and DOM evidence is cryptographically recorded in benchmark manifests.
- Evaluator host environment remains fully isolated from browser rendering exploits.
