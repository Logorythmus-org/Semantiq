# SemantIQ Sandbox Specification: Browser and GUI Execution Provider

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 25)  
**Status**: Approved Specification  
**Date**: 2026-08-15  

---

## 1. Executive Summary

Evaluation of multimodal and browser-use AI agents requires interacting with web pages, desktop GUIs, accessibility trees, and visual viewports.

This specification establishes the **Provider-Neutral Browser & GUI Execution Architecture**:
1. **SemantIQ Core** declares declarative `BrowserGuiSpec` and `GuiActionRequest` contracts without hardcoding driver dependencies.
2. **Provider Adapters** manage underlying display servers (Xvfb/Wayland), browser drivers (Playwright, Puppeteer, CDP, Selenium), or virtual desktop environments inside the sandbox container or VM.
3. **Evidence Normalization Subsystem** converts raw GUI interactions into deterministic `GuiObservationEvent` records with cryptographic screenshot hashes, DOM snapshots, network HAR logs, and console error counts.

```
Benchmark → Execution Contract → Router → Provider Adapter → Runtime (Browser/GUI) → Evidence → SemantIQ
```

---

## 2. Scope

- Specification of browser and virtual desktop sessions (`BrowserGuiSpec`, `ViewportSpec`).
- Action primitives: `navigate`, `click`, `type`, `press_key`, `hover`, `scroll`, `drag_and_drop`, `screenshot`, `evaluate_js`, `get_dom_tree`, `get_accessibility_tree`.
- Observation normalization: screenshots (with SHA256 hashes), DOM tree snapshots, console logs, and network events.
- Deterministic visual and state diff recording for evidence sealing.

---

## 3. Non-Goals

- Writing a proprietary browser rendering engine or display server.
- Storing uncompressed raw multi-gigabyte video streams inside core Git repositories or small evidence records (relying on artifact pointers instead).
- Bypassing sandbox security policies for arbitrary host desktop control.

---

## 4. Architecture

```
+-----------------------------------------------------------------------------------+
|                                  SemantIQ Core                                    |
|  [GUI / Web Benchmark Task]                                                       |
|         |                                                                         |
|         v                                                                         |
|  [EnvironmentSpec with BrowserGuiSpec & Viewport]                                 |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                        Router & Provider Adapter Layer                            |
|  [IBrowserGuiProvider]                                                            |
|         | (Negotiates Chromium / Firefox / WebKit / Virtual Desktop)              |
|         v                                                                         |
|  [Launches Display Server & Browser Session in Sandbox]                           |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                       Isolated Execution Runtime (Sandbox)                        |
|  [Display Server / Browser Engine] <──Input Actions── [Agent]                     |
|         |                                                                         |
|         v (Emits Screenshots, DOM Snapshots, Console Messages)                    |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                        Evidence & Observation Normalizer                          |
|  [GuiObservationNormalizer] (Generates GuiObservationEvent with screenshot SHA)   |
|  [Artifact Sealer] (Stores visual diffs and HAR files in evidence manifest)       |
+-----------------------------------------------------------------------------------+
```

---

## 5. Data & Event Schemas

### 5.1 Browser GUI Specification
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "BrowserGuiSpec",
  "type": "object",
  "required": ["engine", "viewport", "headless", "recordVideo", "recordHar"],
  "properties": {
    "engine": { "type": "string", "enum": ["chromium", "firefox", "webkit", "virtual_desktop"] },
    "viewport": {
      "type": "object",
      "required": ["width", "height"],
      "properties": {
        "width": { "type": "integer" },
        "height": { "type": "integer" },
        "deviceScaleFactor": { "type": "number" },
        "isMobile": { "type": "boolean" }
      }
    },
    "headless": { "type": "boolean" },
    "userAgent": { "type": "string" },
    "recordVideo": { "type": "boolean" },
    "recordHar": { "type": "boolean" },
    "initialUrl": { "type": "string" },
    "locale": { "type": "string" },
    "timezoneId": { "type": "string" }
  }
}
```

---

## 6. Interfaces

- `IBrowserGuiProvider`: Dispatches browser session creation (`launchBrowserSession`).
- `IBrowserGuiSession`: Executes atomic GUI actions (`executeAction`), captures screenshots, and manages session termination.
- `GuiObservationNormalizer`: Creates deterministic evidence records from execution outputs.

---

## 7. Lifecycle & State Machine

```
[CONFIGURED] ──> [INITIALIZING] ──> [READY] ──> [ACTING] ──> [OBSERVING] ──> [CLOSED]
      |                 |                          |
      v                 v                          v
  [SKIPPED]      [CRASH_ON_SPAWN]            [TIMEOUT_PAGE]
```

1. **CONFIGURED**: Benchmark specifies engine, viewport, and recording preferences.
2. **INITIALIZING**: Display server and browser daemon are launched inside the isolated sandbox.
3. **READY**: Initial URL is loaded and DOM state is confirmed.
4. **ACTING**: Agent issues `click`, `type`, or `navigate` actions.
5. **OBSERVING**: Normalized screenshot hashes and DOM trees are captured.
6. **CLOSED**: Browser terminates, and HAR/video artifacts are sealed.

---

## 8. Security & Isolation Model

- **Sandbox Confinement**: Browser processes execute inside isolated container namespaces with `seccomp` profiles and unprivileged user accounts.
- **Egress Filtering**: Network requests follow sandbox `NetworkMode` (e.g. `whitelisted_egress` to prevent data exfiltration).
- **Secret Masking**: Any password or token entered into forms is redacted before logging.

---

## 9. Reproducibility & Provenance

- **Deterministic Viewport & Fonts**: Explicit width, height, device scale factor, locale, and system font packages ensure visual determinism across host platforms.
- **Replay Transport**: In `HERMETIC_DETERMINISTIC` mode, external web endpoints are served from a local mock HTTP server with deterministic HAR replay.

---

## 10. Behavioral Chain Compatibility

| Behavioral Chain Stage | Browser / GUI Role |
| :--- | :--- |
| **Context** | Rendered page view, URL, and accessibility tree presented to agent. |
| **Interpretation** | Agent processes visual screenshot or DOM structure. |
| **Decision** | Agent selects target element and action (`click #checkout`). |
| **Action** | Action dispatched via `executeAction(request)`. |
| **Result** | Browser updates viewport; returns exit status and new URL. |
| **Consequence** | `GuiObservationNormalizer` captures screenshot hash and console errors. |
| **Recovery** | If element not found, agent receives error and adjusts query. |

---

## 11. Provider-Neutral Design

Adapters for Playwright, Puppeteer, Selenium, or native Virtual X11 desktops map onto the identical `GuiActionRequest` protocol, allowing seamless switching between local headless drivers and remote cloud browser pools.

---

## 12. Failure Modes & Mitigations

1. **Page Crash / OOM**: Browser process termination caught by observer; produces `ERR_BROWSER_CRASH`.
2. **Element Not Clickable / Obscured**: Action returns `success: false` with descriptive `errorMessage`.
3. **Navigation Timeout**: Enforced by `timeoutMs`; halts request without hanging the evaluation harness.

---

## 13. Acceptance Criteria

- [x] Standardized `BrowserGuiSpec` and `GuiActionRequest` interfaces.
- [x] Automated normalization of actions into `GuiObservationEvent` records.
- [x] Support for screenshot SHA-256 fingerprinting and console log tracking.
- [x] Comprehensive unit tests passing with zero typecheck or boundary errors.
